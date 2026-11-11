/*
 * Texto base conforme a la Ley N.° 29733 y su Reglamento. Antes de producción:
 * revisar con un abogado e inscribir el banco de datos ante la Autoridad
 * Nacional de Protección de Datos Personales (ANPD) si corresponde.
 */
import { Link } from 'react-router-dom';
import { EMPRESA } from '@/config/empresa';
import { DatoEmpresa, LegalLayout, Seccion } from './LegalLayout';

export function Privacidad() {
  return (
    <LegalLayout
      eyebrow="Legal"
      titulo="Política de Privacidad"
      intro={
        <>
          Aquí explicamos qué datos tuyos usamos, para qué y cómo puedes ejercer tus derechos, conforme a la Ley N.° 29733,
          Ley de Protección de Datos Personales, y su Reglamento.
        </>
      }
    >
      <Seccion titulo="1. Responsable">
        <p>
          El responsable del tratamiento es <strong><DatoEmpresa v={EMPRESA.titular} /></strong>, persona natural que
          opera con el nombre comercial {EMPRESA.nombreComercial}, {EMPRESA.tipoDocumento} <DatoEmpresa v={EMPRESA.documento} />, con domicilio en{' '}
          <DatoEmpresa v={EMPRESA.direccion} />. Contacto para temas de datos personales:{' '}
          <DatoEmpresa v={EMPRESA.correoContacto} />.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué datos usamos">
        <ul>
          <li><strong>Identificación y contacto:</strong> nombre, correo, DNI y número de WhatsApp.</li>
          <li><strong>Compra:</strong> plataforma comprada, monto, fecha, estado del pago, código de la operación y, si pagas por voucher, la imagen del comprobante.</li>
          <li><strong>Uso de la cuenta:</strong> inicios de sesión, fechas de acceso y actividad en las plataformas, para darte el servicio y proteger el contenido.</li>
        </ul>
        <p>
          <strong>No guardamos datos de tu tarjeta.</strong> Los pagos con tarjeta o Yape los procesa Mercado Pago, en su propia página, y nos
          informa solo el resultado de la operación.
        </p>
      </Seccion>

      <Seccion titulo="3. Para qué los usamos">
        <ol>
          <li>Registrar tu compra, verificar el pago y darte acceso a la plataforma.</li>
          <li>Enviarte tu usuario, contraseña, avisos de vencimiento y respuestas de soporte.</li>
          <li>Emitir comprobantes y cumplir obligaciones legales y tributarias.</li>
          <li>Prevenir fraudes, el uso compartido de cuentas y la copia no autorizada del contenido.</li>
          <li>Atender reclamos y solicitudes.</li>
        </ol>
        <p>
          Solo te enviaremos promociones si nos das tu consentimiento por separado, y puedes retirarlo cuando quieras.
        </p>
      </Seccion>

      <Seccion titulo="4. Base legal">
        <p>
          Usamos tus datos porque son necesarios para cumplir el contrato de compra que celebras con nosotros, para cumplir
          obligaciones legales y, en lo demás, con tu consentimiento, que otorgas al aceptar esta política.
        </p>
      </Seccion>

      <Seccion titulo="5. Con quién los compartimos">
        <p>Solo con proveedores que necesitamos para dar el servicio, que los tratan por encargo nuestro:</p>
        <ul>
          <li><strong>Mercado Pago</strong> (procesamiento de pagos con tarjeta y Yape). Recibe tu correo y el monto para cobrar.</li>
          <li><strong>Google</strong> (almacenamiento de datos y envío de correos). Sus servidores pueden estar fuera del Perú, por lo que hay transferencia internacional de datos con las garantías del proveedor.</li>
          <li>Autoridades, cuando una ley o una orden lo exija.</li>
        </ul>
        <p>No vendemos ni alquilamos tus datos.</p>
      </Seccion>

      <Seccion titulo="6. Cuánto tiempo los guardamos">
        <p>
          Mientras tengas una cuenta con nosotros y, después, el tiempo necesario para cumplir obligaciones legales y
          tributarias (hasta 5 años) o para atender reclamos. Luego los eliminamos o anonimizamos.
        </p>
      </Seccion>

      <Seccion titulo="7. Tus derechos">
        <p>
          Puedes pedir <strong>acceso</strong> a tus datos, su <strong>rectificación</strong>, su{' '}
          <strong>cancelación</strong> o <strong>oponerte</strong> a su uso (derechos ARCO), así como revocar tu
          consentimiento. Escríbenos a <DatoEmpresa v={EMPRESA.correoContacto} /> con tu nombre, DNI y lo que pides.
          Te responderemos dentro de los plazos de ley.
        </p>
        <p>
          Si no quedas conforme, puedes presentar una reclamación ante la Autoridad Nacional de Protección de Datos
          Personales del Ministerio de Justicia y Derechos Humanos.
        </p>
      </Seccion>

      <Seccion titulo="8. Seguridad">
        <p>
          Guardamos las contraseñas cifradas (nunca en texto plano), restringimos el acceso a los datos al personal
          necesario y usamos conexiones seguras (HTTPS).
        </p>
      </Seccion>

      <Seccion titulo="9. Almacenamiento en tu navegador">
        <p>
          La web guarda en tu navegador datos técnicos como tu sesión y la compra en curso, para que no pierdas tu
          progreso si cierras la pestaña. No usamos cookies de publicidad.
        </p>
      </Seccion>

      <Seccion titulo="10. Menores de edad">
        <p>
          Si eres menor de edad, necesitas autorización de tu madre, padre o apoderado para darnos tus datos.
        </p>
      </Seccion>

      <Seccion titulo="11. Cambios">
        <p>
          Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha. Revisa también nuestros{' '}
          <Link to="/terminos" className="font-semibold text-jungle-600 underline underline-offset-2">Términos y Condiciones</Link>.
        </p>
      </Seccion>
    </LegalLayout>
  );
}
