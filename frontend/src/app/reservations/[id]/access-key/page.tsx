// TODO: Página de visualización de la llave de acceso digital
// Mostrar el código de acceso (keyCode) y su validez (validFrom - validUntil)
export default function AccessKeyPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Llave de Acceso</h1>
      <p>Reserva ID: {params.id}</p>
      {/* TODO: llamar a reservationApi.getKey(params.id) y mostrar:
            - keyCode (en grande, como un código QR o tarjeta)
            - roomNumber
            - validFrom y validUntil
      */}
    </div>
  );
}
