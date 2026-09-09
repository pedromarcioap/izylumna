import { Gallery } from './types';

export const INITIAL_GALLERIES: Gallery[] = [
  {
    id: 'gal-marina-lucas',
    title: 'Casamento Marina & Lucas',
    clientName: 'Marina Alencar & Lucas Silveira',
    clientEmail: 'marina.alencar@exemplo.com.br',
    clientPhone: '(11) 98765-4321',
    eventDate: '2026-08-15',
    description: 'Olá Marina e Lucas! Foi um prazer registrar esse dia inesquecível na Fazenda Santa Bárbara. Por favor, selecionem as fotos favoritas de vocês com carinho para iniciarmos o processo de edição fina e diagramação do álbum.',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    status: 'awaiting_client',
    privacy: 'private',
    pinCode: '4826',
    quotaIncluded: 20,
    excessPolicy: 'charge',
    extraPhotoPrice: 35.0,
    watermarkEnabled: true,
    watermarkText: 'PROVA • LUMINA STUDIO • PROVA',
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    photos: [
      {
        id: 'p-ml-01',
        originalFileName: 'IMG_4021.CR3',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        caption: 'A chegada da noiva',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-02',
        originalFileName: 'IMG_4024.CR3',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
        caption: 'Olhares no altar',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-03',
        originalFileName: 'IMG_4030.CR3',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop',
        caption: 'Votos emocionados',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-04',
        originalFileName: 'IMG_4038.CR3',
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop',
        caption: 'Troca de alianças',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-05',
        originalFileName: 'IMG_4045.CR3',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
        caption: 'O primeiro beijo de casados',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-06',
        originalFileName: 'IMG_4052.CR3',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop',
        caption: 'Chuva de arroz e comemoração',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-07',
        originalFileName: 'IMG_4060.CR3',
        url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1000&auto=format&fit=crop',
        caption: 'Retrato no pôr do sol',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-08',
        originalFileName: 'IMG_4068.CR3',
        url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=1200&auto=format&fit=crop',
        caption: 'Detalhes do buquê e alianças',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-09',
        originalFileName: 'IMG_4073.CR3',
        url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop',
        caption: 'Caminhada dos noivos no bosque',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-10',
        originalFileName: 'IMG_4085.CR3',
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop',
        caption: 'Brinde dos padrinhos',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-11',
        originalFileName: 'IMG_4091.CR3',
        url: 'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1000&auto=format&fit=crop',
        caption: 'A dança dos noivos',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-12',
        originalFileName: 'IMG_4102.CR3',
        url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=1200&auto=format&fit=crop',
        caption: 'Festa e celebração com amigos',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-13',
        originalFileName: 'IMG_4110.CR3',
        url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop',
        caption: 'Detalhe da decoração iluminada',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-14',
        originalFileName: 'IMG_4118.CR3',
        url: 'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?q=80&w=1000&auto=format&fit=crop',
        caption: 'Mesa do bolo e doces finos',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-15',
        originalFileName: 'IMG_4125.CR3',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop',
        caption: 'Abraço com os pais',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-16',
        originalFileName: 'IMG_4130.CR3',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop',
        caption: 'Entrada na recepção',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-17',
        originalFileName: 'IMG_4139.CR3',
        url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1000&auto=format&fit=crop',
        caption: 'Retrato individual do noivo',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-18',
        originalFileName: 'IMG_4145.CR3',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
        caption: 'Retrato individual da noiva',
        orientation: 'portrait'
      },
      {
        id: 'p-ml-19',
        originalFileName: 'IMG_4152.CR3',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
        caption: 'Amigos na pista de dança',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-20',
        originalFileName: 'IMG_4160.CR3',
        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
        caption: 'Corte do bolo',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-21',
        originalFileName: 'IMG_4170.CR3',
        url: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?q=80&w=1200&auto=format&fit=crop',
        caption: 'Despedida com sparklers luminosos',
        orientation: 'landscape'
      },
      {
        id: 'p-ml-22',
        originalFileName: 'IMG_4185.CR3',
        url: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=1200&auto=format&fit=crop',
        caption: 'Espontânea dos noivos rindo',
        orientation: 'landscape'
      }
    ],
    clientSelection: {
      status: 'pending',
      selectedPhotoIds: [
        'p-ml-01', 'p-ml-02', 'p-ml-03', 'p-ml-04', 'p-ml-05',
        'p-ml-06', 'p-ml-07', 'p-ml-08', 'p-ml-09', 'p-ml-10',
        'p-ml-11', 'p-ml-12', 'p-ml-13', 'p-ml-14', 'p-ml-15',
        'p-ml-16', 'p-ml-17', 'p-ml-18', 'p-ml-19', 'p-ml-20',
        'p-ml-21', 'p-ml-22' // 22 selected (20 in package + 2 extras = R$ 70,00)
      ],
      comments: {
        'p-ml-01': 'Por favor, clarear um pouco a sombra no vestido.',
        'p-ml-07': 'Adoramos essa! Se possível, remover a pessoa de fundo à esquerda.'
      },
      clientNotes: 'Amamos todas as fotos! Decidimos pegar 2 extras além do pacote para não deixar de fora os sparklers.'
    }
  },
  {
    id: 'gal-camila-tomas',
    title: 'Ensaio Gestante - Esperando Helena',
    clientName: 'Camila Rossi & Tomás Veiga',
    clientEmail: 'camila.rossi@gmail.com',
    clientPhone: '(21) 99123-4567',
    eventDate: '2026-07-28',
    description: 'Ensaio ao ar livre no início da manhã. Por favor, escolha até 15 fotos incluídas no seu pacote de gestante para o tratamento fino de pele e cores.',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
    status: 'awaiting_client',
    privacy: 'private',
    pinCode: '1234',
    quotaIncluded: 15,
    excessPolicy: 'block', // Strict block: client cannot select more than 15
    extraPhotoPrice: 0,
    watermarkEnabled: true,
    watermarkText: 'PROVA DE SELEÇÃO • PROIBIDO REPRODUZIR',
    createdAt: '2026-07-30T15:00:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
    photos: [
      {
        id: 'p-ct-01',
        originalFileName: 'DSC_0092.JPG',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
        caption: 'Luz dourada da manhã',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-02',
        originalFileName: 'DSC_0098.JPG',
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop',
        caption: 'Mãos na barriga com sapatinho',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-03',
        originalFileName: 'DSC_0104.JPG',
        url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop',
        caption: 'O abraço do casal',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-04',
        originalFileName: 'DSC_0112.JPG',
        url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=1000&auto=format&fit=crop',
        caption: 'Retrato sereno da mamãe',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-05',
        originalFileName: 'DSC_0120.JPG',
        url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1200&auto=format&fit=crop',
        caption: 'Sorrisos espontâneos sob as árvores',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-06',
        originalFileName: 'DSC_0129.JPG',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
        caption: 'Close no olhar',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-07',
        originalFileName: 'DSC_0135.JPG',
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop',
        caption: 'Silhueta contra a luz',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-08',
        originalFileName: 'DSC_0144.JPG',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
        caption: 'Carinho no jardim',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-09',
        originalFileName: 'DSC_0150.JPG',
        url: 'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1000&auto=format&fit=crop',
        caption: 'Detalhe do vestido esvoaçante',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-10',
        originalFileName: 'DSC_0159.JPG',
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop',
        caption: 'Passeio pelo caminho de pedras',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-11',
        originalFileName: 'DSC_0167.JPG',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        caption: 'Olhar cúmplice',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-12',
        originalFileName: 'DSC_0172.JPG',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop',
        caption: 'Alegria do papai',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-13',
        originalFileName: 'DSC_0180.JPG',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
        caption: 'Beijo na testa',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-14',
        originalFileName: 'DSC_0188.JPG',
        url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1000&auto=format&fit=crop',
        caption: 'Sentados no gramado',
        orientation: 'portrait'
      },
      {
        id: 'p-ct-15',
        originalFileName: 'DSC_0195.JPG',
        url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop',
        caption: 'Foto final com pôr do sol',
        orientation: 'landscape'
      },
      {
        id: 'p-ct-16',
        originalFileName: 'DSC_0201.JPG',
        url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=1200&auto=format&fit=crop',
        caption: 'Detalhe dos pezinhos na manta',
        orientation: 'landscape'
      }
    ],
    clientSelection: {
      status: 'pending',
      selectedPhotoIds: [
        'p-ct-01', 'p-ct-02', 'p-ct-03', 'p-ct-04', 'p-ct-05',
        'p-ct-07', 'p-ct-08', 'p-ct-09', 'p-ct-11', 'p-ct-13'
      ], // 10 selected of 15
      comments: {
        'p-ct-02': 'Poderia fazer uma versão em preto e branco dessa foto?'
      }
    }
  },
  {
    id: 'gal-editorial-clara',
    title: 'Editorial Urbano & Retratos - Clara Menezes',
    clientName: 'Clara Menezes',
    clientEmail: 'claramenezes.fashion@gmail.com',
    clientPhone: '(31) 97654-3210',
    eventDate: '2026-08-02',
    description: 'Ensaio de moda e posicionamento de imagem. Cota base contratada de 10 fotos, mas com liberação de seleção de fotos excedentes sem custo adicional (aprovação pura do lote a ser tratado e entregue em alta resolução).',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    status: 'completed',
    privacy: 'public',
    quotaIncluded: 10,
    excessPolicy: 'free_approval', // Free approval mode: client selects whatever they need treated without financial charges
    extraPhotoPrice: 0,
    watermarkEnabled: true,
    watermarkText: 'PROOF • CLARA MENEZES • LUMINA',
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-08T16:45:00Z',
    photos: [
      {
        id: 'p-cm-01',
        originalFileName: 'CM_LOOK1_001.CR3',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
        caption: 'Look 1 - Alfaiataria e luz lateral',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-02',
        originalFileName: 'CM_LOOK1_014.CR3',
        url: 'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1000&auto=format&fit=crop',
        caption: 'Look 1 - Movimento e passos',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-03',
        originalFileName: 'CM_LOOK2_028.CR3',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        caption: 'Look 2 - Vestido fluido',
        orientation: 'landscape'
      },
      {
        id: 'p-cm-04',
        originalFileName: 'CM_LOOK2_035.CR3',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop',
        caption: 'Look 2 - Detalhe maquiagem',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-05',
        originalFileName: 'CM_LOOK3_050.CR3',
        url: 'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?q=80&w=1000&auto=format&fit=crop',
        caption: 'Look 3 - Jaqueta de couro e sombra',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-06',
        originalFileName: 'CM_LOOK3_062.CR3',
        url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1000&auto=format&fit=crop',
        caption: 'Look 3 - Poses dinâmicas no concreto',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-07',
        originalFileName: 'CM_LOOK3_071.CR3',
        url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1000&auto=format&fit=crop',
        caption: 'Retrato fechado com óculos de sol',
        orientation: 'portrait'
      },
      {
        id: 'p-cm-08',
        originalFileName: 'CM_LOOK4_084.CR3',
        url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop',
        caption: 'Look 4 - Neon e reflexo urbano',
        orientation: 'landscape'
      },
      {
        id: 'p-cm-09',
        originalFileName: 'CM_LOOK4_093.CR3',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
        caption: 'Look 4 - Contra-luz noturno',
        orientation: 'landscape'
      },
      {
        id: 'p-cm-10',
        originalFileName: 'CM_LOOK4_105.CR3',
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop',
        caption: 'Look 4 - Sorriso espontâneo',
        orientation: 'landscape'
      },
      {
        id: 'p-cm-11',
        originalFileName: 'CM_LOOK4_112.CR3',
        url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=1200&auto=format&fit=crop',
        caption: 'Detalhe de anéis e pulseiras',
        orientation: 'landscape'
      },
      {
        id: 'p-cm-12',
        originalFileName: 'CM_LOOK4_120.CR3',
        url: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=1200&auto=format&fit=crop',
        caption: 'Final do ensaio no café',
        orientation: 'landscape'
      }
    ],
    clientSelection: {
      status: 'submitted',
      selectedPhotoIds: [
        'p-cm-01', 'p-cm-02', 'p-cm-03', 'p-cm-04', 'p-cm-05',
        'p-cm-06', 'p-cm-07', 'p-cm-08', 'p-cm-09', 'p-cm-10',
        'p-cm-11', 'p-cm-12' // 12 selected: 10 in quota + 2 approved free extras
      ],
      comments: {
        'p-cm-01': 'Essa é perfeita para a foto de perfil do LinkedIn e do site!',
        'p-cm-05': 'Tratar marcas de expressão leves ao redor dos olhos, por favor.'
      },
      completedAt: '2026-08-08T16:45:00Z',
      clientNotes: 'Seleção finalizada! Todas as 12 fotos aprovadas para tratamento de alta resolução da campanha.'
    }
  }
];
