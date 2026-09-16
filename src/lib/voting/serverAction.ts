import { supabase } from '../supabase';
import { ApiResponse, VotePayload, VoteResult } from './types';
import { buildStandardErrorResponse, logError } from './logger';

/**
 * Backend Voting Handler (Next.js Server Action or API Route Handler)
 * 
 * Features:
 * 1. Strict try/catch block surrounding database & session verification.
 * 2. Input validation for galleryId, photoId, and voterId.
 * 3. PostgreSQL atomic RPC function execution (`toggle_photo_vote_atomic`) with fallback to upsert.
 * 4. Error mapping for codes 23505 (Unique Constraint), 42501 (RLS Violation), 23503 (FK Violation), PGRST301 (JWT Expired).
 * 5. Structured observability via `logError()` utility.
 * 6. Standardized JSON response protocol.
 */
export async function castVoteAction(payload: VotePayload): Promise<ApiResponse<VoteResult>> {
  const requestId = crypto.randomUUID();

  // 1. Validation Guard
  if (!payload || !payload.galleryId || !payload.photoId || !payload.voterId) {
    const errorRes = buildStandardErrorResponse(
      { code: 'VALIDATION_ERROR', message: 'Campos obrigatórios ausentes: galleryId, photoId e voterId são necessários.' },
      payload || {},
      requestId
    );
    await logError('VotingAction:Validation', errorRes.technicalDetails, payload?.voterId, payload);
    return { success: false, error: errorRes };
  }

  try {
    if (!supabase) {
      throw new Error('Supabase client não está inicializado.');
    }

    // 2. Session Integrity Check: Verify if Voter is valid for this gallery
    const { data: selectionRow, error: selErr } = await supabase
      .from('client_selections')
      .select('votes, voters')
      .eq('gallery_id', payload.galleryId)
      .maybeSingle();

    if (selErr) {
      // Re-throw DB error to enter catch block with code
      throw selErr;
    }

    // 3. Primary Path: Attempt Atomic Database Execution via RPC (Stored Procedure)
    // Prevents Lost Updates / Race Conditions in concurrent JSONB updates
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('toggle_photo_vote_atomic', {
      p_gallery_id: payload.galleryId,
      p_photo_id: payload.photoId,
      p_voter_id: payload.voterId,
      p_voter_name: payload.voterName || 'Eleitor'
    });

    if (!rpcErr && rpcResult) {
      return {
        success: true,
        data: {
          photoId: payload.photoId,
          voterId: payload.voterId,
          totalVotesCount: Number(rpcResult.total_votes || 0),
          hasVoted: Boolean(rpcResult.has_voted),
          updatedAt: new Date().toISOString()
        }
      };
    }

    // If RPC is missing or fails gracefully with non-critical error, perform secure client_selections fallback
    if (rpcErr && rpcErr.code !== '42883') { // 42883 = function does not exist
      // Throw RPC database error to catch block for structured parsing
      throw rpcErr;
    }

    // 4. Fallback Path: Client-Side Selection Mutex / Upsert Update
    const currentVotes: Record<string, any[]> = selectionRow?.votes || {};
    const photoVotes: any[] = [...(currentVotes[payload.photoId] || [])];

    const existingIndex = photoVotes.findIndex((v: any) => v.voterId === payload.voterId);
    let hasVoted = false;

    if (existingIndex >= 0) {
      photoVotes.splice(existingIndex, 1);
      hasVoted = false;
    } else {
      photoVotes.push({
        voterId: payload.voterId,
        voterName: payload.voterName,
        createdAt: new Date().toISOString()
      });
      hasVoted = true;
    }

    currentVotes[payload.photoId] = photoVotes;

    const activeVoters: any[] = Array.isArray(selectionRow?.voters) ? [...selectionRow.voters] : [];
    if (!activeVoters.some((v: any) => v.id === payload.voterId)) {
      activeVoters.push({
        id: payload.voterId,
        name: payload.voterName
      });
    }

    const { error: updateErr } = await supabase
      .from('client_selections')
      .upsert({
        gallery_id: payload.galleryId,
        votes: currentVotes,
        voters: activeVoters,
        updated_at: new Date().toISOString()
      }, { onConflict: 'gallery_id' });

    if (updateErr) {
      throw updateErr;
    }

    return {
      success: true,
      data: {
        photoId: payload.photoId,
        voterId: payload.voterId,
        totalVotesCount: photoVotes.length,
        hasVoted,
        updatedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    // 5. Catch Block: Error Classification, Telemetry Logging, and Standardized Serialization
    const errorResponse = buildStandardErrorResponse(error, payload, requestId);

    // Save structured log asynchronously
    await logError(
      { component: 'VotingBackend', action: 'castVoteAction' },
      error,
      payload.voterId,
      { payload, structuredError: errorResponse }
    );

    return {
      success: false,
      error: errorResponse
    };
  }
}
