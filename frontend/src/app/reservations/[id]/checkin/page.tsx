// TODO: Página del formulario de check-in
// Recoger datos del huésped: tipo de documento, número, método de pago, etc.
export default function CheckInPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Check-In</h1>
      <p>Reserva ID: {params.id}</p>
      {/* TODO: formulario con campos: documentType, documentNumber, guests[], paymentMethod */}
      {/* TODO: al enviar llamar a reservationApi.checkIn(params.id, formData) */}
    </div>
  );
}
