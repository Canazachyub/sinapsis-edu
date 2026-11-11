/*
 * Texto base. Antes de pasar a producción conviene que lo revise un abogado
 * (en especial la política de devoluciones y la ley aplicable).
 */
import { Link } from 'react-router-dom';
import { EMPRESA } from '@/config/empresa';
import { DatoEmpresa, LegalLayout, Seccion } from './LegalLayout';

export function Terminos() {
  return (
    <LegalLayout
      eyebrow="Legal"
      titulo="Términos y Condiciones"
      intro={
        <>
          Estos términos regulan la compra y el uso de las plataformas de {EMPRESA.nombreComercial} ({EMPRESA.sitio}).
          Al comprar o usar una plataforma aceptas estas condiciones. Léelas con calma: son cortas.
        </>
      }
    >
      <Seccion titulo="1. Quiénes somos">
        <p>
          {EMPRESA.nombreComercial} es un nombre comercial de <strong><DatoEmpresa v={EMPRESA.razonSocial} /></strong>,
          con RUC <DatoEmpresa v={EMPRESA.ruc} />, domicilio en <DatoEmpresa v={EMPRESA.direccion} /> y correo de
          contacto <DatoEmpresa v={EMPRESA.correoContacto} />.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué vendemos">
        <p>
          Vendemos acceso temporal, por internet, a plataformas de estudio para medicina: bancos de preguntas con
          justificación, simulacros, videoclases y material de consulta. Cada plataforma muestra en su página qué
          incluye, su precio y cuántos días dura el acceso.
        </p>
        <p>
          Nuestros materiales sirven para prepararte. No garantizamos un puntaje ni el ingreso en ningún examen.
        </p>
      </Seccion>

      <Seccion titulo="3. Tu cuenta">
        <ul>
          <li>Debes dar datos reales: nombre, correo, DNI y WhatsApp. El acceso se envía al correo que indiques.</li>
          <li>Si eres menor de edad, debes comprar con autorización de tu madre, padre o apoderado.</li>
          <li>Eres responsable de guardar tu contraseña. Si sospechas que alguien la conoce, cámbiala o escríbenos.</li>
        </ul>
      </Seccion>

      <Seccion titulo="4. Precio y pago">
        <ul>
          <li>Los precios están en soles (S/) e incluyen los impuestos que correspondan. El precio que se cobra es el que ves al pagar.</li>
          <li>
            Puedes pagar con tarjeta de débito o crédito y con Yape a través de la pasarela Culqi. Los datos de tu tarjeta
            los recibe directamente Culqi; nosotros no los vemos ni los guardamos.
          </li>
          <li>También puedes pagar por transferencia, Yape o Binance enviando tu comprobante (voucher). En ese caso
            activamos el acceso después de verificar el pago, en un plazo máximo de 24 horas hábiles.</li>
          <li>Una compra pendiente de pago con tarjeta o Yape vence a los 30 minutos si no se completa.</li>
        </ul>
      </Seccion>

      <Seccion titulo="5. Vigencia del acceso">
        <ul>
          <li>El acceso empieza cuando se aprueba el pago y dura los días indicados en la plataforma (por ejemplo, 30 días).</li>
          <li>El plazo corre de forma continua: no se pausa ni se congela.</li>
          <li>Si renuevas antes de que termine, los días nuevos se suman a los que te quedan.</li>
          <li>Al terminar la vigencia, el acceso se cierra automáticamente. Puedes renovarlo cuando quieras.</li>
        </ul>
      </Seccion>

      <Seccion id="uso-personal" titulo="6. Uso personal: prohibido compartir o revender">
        <p>Tu acceso es <strong>personal e intransferible</strong>. Está prohibido:</p>
        <ul>
          <li>Compartir tu usuario y contraseña, o usar la misma cuenta entre varias personas.</li>
          <li>Revender, alquilar, sortear o ceder tu acceso.</li>
          <li>Copiar, descargar de forma masiva, fotografiar, grabar o publicar las preguntas, justificaciones, videos o
            material, total o parcialmente, en grupos, redes sociales, sitios web o cualquier otro medio.</li>
          <li>Usar programas, robots o scripts para extraer el contenido.</li>
        </ul>
        <p>
          Para proteger el contenido podemos registrar los dispositivos y la actividad de cada cuenta, limitar las
          sesiones simultáneas y marcar el material con datos de tu cuenta.
        </p>
      </Seccion>

      <Seccion titulo="7. Suspensión de la cuenta">
        <p>
          Si incumples la sección 6 o usas la plataforma de forma fraudulenta, podemos suspender o cancelar tu acceso
          <strong> sin reembolso</strong>. Te avisaremos por correo indicando el motivo y podrás darnos tu versión.
          Esto no limita las acciones legales que correspondan por infracción de derechos de autor.
        </p>
      </Seccion>

      <Seccion titulo="8. Propiedad intelectual">
        <p>
          El contenido de las plataformas está protegido por la ley de derechos de autor (Decreto Legislativo N.° 822)
          y pertenece a <DatoEmpresa v={EMPRESA.razonSocial} /> o a sus autores y licenciantes. Comprar un acceso te da
          permiso para usarlo durante la vigencia, solo para tu estudio personal; no te transfiere ningún derecho sobre él.
        </p>
      </Seccion>

      <Seccion id="devoluciones" titulo="9. Devoluciones">
        <p>
          Por tratarse de un servicio digital que se activa al instante, en general no hay devolución una vez que el
          acceso está activo. Sí devolvemos el dinero en estos casos:
        </p>
        <ul>
          <li><strong>Cobro duplicado</strong> o cobro de un monto distinto al publicado: siempre, por la diferencia o el cargo repetido.</li>
          <li><strong>No recibiste el acceso</strong> por un problema nuestro y no lo resolvimos dentro de las 72 horas de tu aviso.</li>
          <li><strong>Falla técnica</strong> atribuible a nosotros que impida usar la plataforma por más de 72 horas seguidas: devolvemos la parte proporcional o, si prefieres, sumamos esos días a tu acceso.</li>
          <li><strong>Arrepentimiento</strong>: dentro de los 7 días calendario desde la compra, si todavía no usaste la plataforma (no resolviste preguntas ni simulacros ni viste clases).</li>
        </ul>
        <p>
          Para pedir una devolución escríbenos a <DatoEmpresa v={EMPRESA.correoContacto} /> o por WhatsApp con tu código
          de compra. Respondemos en un máximo de 15 días hábiles. Si la aprobamos, la devolución se hace por el mismo
          medio de pago; con tarjeta, el banco puede tardar en reflejarla.
        </p>
        <p>Cuando se devuelve un pago, el acceso de esa compra se cierra.</p>
      </Seccion>

      <Seccion titulo="10. Disponibilidad y soporte">
        <p>
          Trabajamos para que las plataformas estén disponibles todo el tiempo, pero puede haber interrupciones breves por
          mantenimiento o por fallas de proveedores externos. Te damos soporte por WhatsApp y correo en el horario publicado.
        </p>
      </Seccion>

      <Seccion titulo="11. Reclamos">
        <p>
          Si no estás conforme con nuestro servicio puedes registrar un reclamo o una queja en nuestro{' '}
          <Link to="/libro-de-reclamaciones" className="font-semibold text-jungle-600 underline underline-offset-2">Libro de Reclamaciones virtual</Link>,
          conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571). También puedes acudir a INDECOPI.
        </p>
      </Seccion>

      <Seccion titulo="12. Datos personales">
        <p>
          Tratamos tus datos según nuestra{' '}
          <Link to="/privacidad" className="font-semibold text-jungle-600 underline underline-offset-2">Política de Privacidad</Link>{' '}
          y la Ley N.° 29733, Ley de Protección de Datos Personales.
        </p>
      </Seccion>

      <Seccion titulo="13. Cambios y ley aplicable">
        <p>
          Podemos actualizar estos términos; la versión vigente es la publicada en esta página con su fecha. Los cambios no
          afectan las compras ya hechas. Estos términos se rigen por las leyes del Perú.
        </p>
      </Seccion>
    </LegalLayout>
  );
}
