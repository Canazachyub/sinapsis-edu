/**
 * Preguntas reales de muestra para la landing, tomadas de los bancos
 * "BANCO ENAM EXPLICADO.xlsx" y "BANCO RESIDENTADO MEDICO MYC.xlsx".
 *
 * Mismo formato de columnas que la plataforma:
 *   Question Text · Question Type · Option 1..5 · Correct Answer · Time in seconds ·
 *   Image Link · JUSTIFICACION · NUMERO · CURSO · TEMA · SUBTEMA · NOMBRE DEL ARCHIVO
 *
 * Extras opcionales para la explicación mejorada:
 *   - En JUSTIFICACION, `**texto**` se muestra en negrita resaltada.
 *   - PISTAS: fragmentos exactos del enunciado que se resaltan al responder.
 *   - PERLA: dato clave corto para memorizar.
 *
 * `correctAnswer` es 1-based, igual que en la hoja.
 */

export interface PreguntaBanco {
  questionText: string;
  questionType: 'Multiple Choice';
  options: string[];
  correctAnswer: number;
  timeInSeconds: number;
  imageLink?: string;
  justificacion: string;
  numero?: string;
  curso: string;
  tema?: string;
  subtema?: string;
  nombreDelArchivo: string;
  pistas?: string[];
  perla?: string;
  /** Dibujo didáctico de resolución (ChatGPT) que se muestra en la explicación. */
  lamina?: { src: string; pie: string };
}

export const PREGUNTAS_MUESTRA: PreguntaBanco[] = [
  {
    // BANCO ENAM EXPLICADO · fila 176
    questionText:
      'Mujer de 45 años, acude a emergencia por quemadura con agua caliente. Al examen: quemaduras en cara anterior del tronco, periné y cara anterior de miembro inferior derecho. ¿Cuál es el porcentaje de superficie corporal comprometida según la regla de los 9?',
    questionType: 'Multiple Choice',
    options: ['28%', '30%', '19%', '37%'],
    correctAnswer: 1,
    timeInSeconds: 90,
    justificacion:
      'Según la **regla de los nueves** el área corporal quemada será: **Tronco anterior: 18%**, **periné: 1%**, y **cara anterior del miembro inferior derecho: 9%**. Haciendo un total de **28% de superficie corporal quemada**.',
    curso: 'Cirugía plástica y quemados',
    nombreDelArchivo: 'ENAM 2021 Extraordinario',
    pistas: ['cara anterior del tronco', 'periné', 'cara anterior de miembro inferior derecho'],
    perla:
      'Regla de los 9 en el adulto: cabeza 9 %, cada miembro superior 9 %, tronco anterior 18 %, tronco posterior 18 %, cada miembro inferior 18 % y periné 1 %.',
    lamina: { src: '/images/preguntas/q1.webp', pie: 'Regla de los nueve: tronco anterior (18 %) + periné (1 %) + cara anterior del miembro inferior derecho (9 %) = 28 %.' },
  },
  {
    // BANCO ENAM EXPLICADO · fila 717
    questionText:
      'Lactante de 15 días de vida con lactancia entrecortada, polipnea y cianosis. Rx de tórax: silueta cardíaca de pedículo estrecho y en "forma ovoide" con aumento de flujo sanguíneo pulmonar. ¿Cuál es el diagnóstico más probable?',
    questionType: 'Multiple Choice',
    options: [
      'Tetralogía de Fallot',
      'Comunicación interventricular',
      'Persistencia del conducto arterioso',
      'Transposición de grandes arterias',
    ],
    correctAnswer: 4,
    timeInSeconds: 90,
    justificacion:
      'Recordemos las imágenes características de las principales cardiopatías congénitas: Tetralogía de Fallot = signo del **zapato sueco**. Drenaje venoso pulmonar anómalo = signo del **muñeco de nieve**. Transposición de grandes vasos = **corazón en huevo**.',
    curso: 'Pediatría',
    nombreDelArchivo: 'ENAM 2020',
    pistas: ['cianosis', 'pedículo estrecho', '"forma ovoide"', 'aumento de flujo sanguíneo pulmonar'],
    perla:
      'Neonato cianótico + corazón «en huevo» con pedículo estrecho + hiperflujo pulmonar = transposición de grandes arterias.',
    lamina: { src: '/images/preguntas/q2.webp', pie: 'Corazón «en huevo» colgado de un pedículo estrecho, con pulmones de flujo aumentado: transposición de grandes arterias.' },
  },
  {
    // BANCO ENAM EXPLICADO · fila 401
    questionText:
      'Varón de 45 años, alcohólico crónico, hace 6 meses de debilidad y parestesias de extremidades, disnea al esfuerzo. Al examen: pálido, pérdida de la sensibilidad termoalgésica, cuadriparesia espástica leve a predominio distal, Hb: 7 gr/dl, VCM: 120 fl. ¿Cuál sería el diagnóstico más probable?',
    questionType: 'Multiple Choice',
    options: ['Síndrome de Guillain Barre', 'Encefalopatía hepática', 'Déficit de vitamina B12', 'Anemia sideroblástica'],
    correctAnswer: 3,
    timeInSeconds: 90,
    justificacion:
      'La pregunta describe un cuadro de **anemia macrocítica asociada a síntomas neurológicos**, compatible con **anemia megaloblástica por déficit de vitamina B12** (la asociada a déficit de ácido fólico **no cursa con síntomas neurológicos**).',
    curso: 'Hematología',
    nombreDelArchivo: 'ENAM 2020',
    pistas: ['parestesias de extremidades', 'cuadriparesia espástica', 'Hb: 7 gr/dl', 'VCM: 120 fl'],
    perla: 'VCM > 100 fl + clínica neurológica → déficit de B12. El déficit de folato da la misma anemia, pero sin compromiso neurológico.',
    lamina: { src: '/images/preguntas/q3.webp', pie: 'Glóbulos rojos grandes (macrocitosis) y neutrófilo hipersegmentado, con daño neurológico asociado: déficit de vitamina B12.' },
  },
  {
    // BANCO ENAM EXPLICADO · fila 524
    questionText:
      'Varón de 55 años que presenta un derrame pleural cuyo líquido presenta: aspecto amarillo citrino, cociente de proteínas pleura/suero 0,8, cociente de LDH pleura/suero 0,9, Gram y Ziehl Neelsen negativos, células mesoteliales <5%, linfocitos 98%, ADA 67 U/l, PAP: negativo. ¿Cuál es el diagnóstico más probable?',
    questionType: 'Multiple Choice',
    options: [
      'Tuberculosis pleural',
      'Empiema pleural',
      'Derrame pleural por insuficiencia cardiaca',
      'Mesotelioma pleural',
    ],
    correctAnswer: 1,
    timeInSeconds: 90,
    justificacion:
      'Las características del líquido pleural (aspecto amarillo citrino), además que cumple con **criterios de exudado** (cociente de proteínas pleura/suero 0,8, cociente de LDH pleura/suero 0,9), dan como primera posibilidad diagnóstica **tuberculosis pleural**.',
    curso: 'Neumología',
    nombreDelArchivo: 'ENAM 2021',
    pistas: ['cociente de proteínas pleura/suero 0,8', 'cociente de LDH pleura/suero 0,9', 'linfocitos 98%', 'ADA 67 U/l'],
    perla: 'Exudado de predominio linfocítico con ADA elevado (> 40 U/L) es muy sugestivo de tuberculosis pleural, aunque el Ziehl-Neelsen salga negativo.',
    lamina: { src: '/images/preguntas/q4.webp', pie: 'Derrame pleural derecho de líquido amarillo citrino: exudado linfocítico con ADA alto, sugestivo de tuberculosis pleural.' },
  },
  {
    // BANCO ENAM EXPLICADO · fila 155
    questionText:
      'Varón de 24 años, hace 1 año tuvo herida de bala en muslo izquierdo. Consulta por hinchazón en ese muslo y dolor al caminar. Al examen: cicatriz de herida en muslo izquierdo con aumento de volumen, en la misma zona se palpa frémito y se ausculta soplo holosistólico. Pulso poplíteo y pedio disminuidos. ¿Cuál es el diagnóstico más probable?',
    questionType: 'Multiple Choice',
    options: ['Fístula arteriovenosa', 'Trombosis venosa profunda', 'Trombosis arterial profunda', 'Flemón en muslo izquierdo'],
    correctAnswer: 1,
    timeInSeconds: 90,
    justificacion:
      'La presencia de **frémito a la palpación** y de **soplo continuo a la auscultación** son signos altamente sugestivos de **fístula arteriovenosa**, además refuerza la sospecha la **claudicación** (dolor al caminar) que tiene el paciente, y los **pulsos distales disminuidos**.',
    curso: 'Cirugía de tórax y cardiovascular',
    nombreDelArchivo: 'ENAM 2021 Extraordinario',
    pistas: ['herida de bala', 'dolor al caminar', 'frémito', 'soplo holosistólico', 'Pulso poplíteo y pedio disminuidos'],
    perla: 'Trauma penetrante previo + frémito y soplo en la misma zona = fístula arteriovenosa traumática hasta demostrar lo contrario.',
    lamina: { src: '/images/preguntas/q5.webp', pie: 'Comunicación directa entre arteria y vena bajo la cicatriz: el paso de flujo produce frémito y soplo, y la vena se dilata.' },
  },
  {
    // BANCO RESIDENTADO MEDICO MYC · fila 12
    questionText: '¿Cuál es el músculo principal de la inspiración?',
    questionType: 'Multiple Choice',
    options: ['Diafragma', 'Serrato posterior superior', 'Transverso del tórax', 'Trapecio', 'Esternocleidomastoideo'],
    correctAnswer: 1,
    timeInSeconds: 90,
    justificacion:
      'El músculo **diafragma es el principal músculo inspiratorio**, recordemos que es inervado por el **nervio frénico**, que nace de C4, y que su contracción produce **presión negativa pleural**, que es el principal mecanismo en la inspiración.',
    curso: 'Anatomía',
    nombreDelArchivo: 'RM 2019',
    perla: 'Nervio frénico: C3, C4 y C5 («C3, 4 y 5 mantienen vivo al diafragma»), con aporte principal de C4.',
    lamina: { src: '/images/preguntas/q6.webp', pie: 'El diafragma se contrae y desciende, aumenta el volumen del tórax y entra el aire. Lo inerva el nervio frénico (C3–C5).' },
  },
];
