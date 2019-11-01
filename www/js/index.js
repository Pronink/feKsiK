// Evento lanzado cuando la página ha sido totalmente cargada:
window.addEventListener('load', function () {
    $('body').fadeIn();
    $('#nav a').on('click', function () {
        $('#nav a').removeAttr('data-colorPrimario');
        $(this).attr('data-colorPrimario', true);
    });

    // Prevenir ir hacia atrás en el navegador. En el móvil la app se cierra gracias a una función en index.js
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function(event) {
        history.pushState(null, null, location.href);
    });
});
// Función para que la app se cierra cuando pulsas el botón de atrás:
document.addEventListener("backbutton", function () {
    window.navigator.app.exitApp();
}, false);