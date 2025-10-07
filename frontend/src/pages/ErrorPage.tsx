export default function ErrorPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Algo salió mal</h1>
      <p>La ruta no existe o hubo un error al cargar la página.</p>
      <a href="/" style={{ color: "#646cff" }}>Volver al inicio</a>
    </div>
  );
}
