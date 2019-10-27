// Evento lanzado cuando la página ha sido totalmente cargada:
window.addEventListener('load', function () {
    $('body').fadeIn();
    $('#nav a').on('click', function () {
        $('#nav a').removeAttr('data-colorPrimario');
        $(this).attr('data-colorPrimario', true);
    });
});


