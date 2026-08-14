// TODO: Página de detalle de una reserva
// Mostrar los datos de la reserva y los botones de acción (check-in, cancelar)
export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Detalle de Reserva</h1>
      <p>ID: {params.id}</p>
      {/* TODO: llamar a reservationApi.getById(params.id) y mostrar los datos */}
    </div>
  );
}
