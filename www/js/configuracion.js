function pintarDesplegableUsuarios() {
    // Obtener el usuario actual
    let usuarioActualId;
    if (memoria.obtener('usuarioId', true)) {
        usuarioActualId = parseInt(memoria.obtener('usuarioId', true));
    }
    pintor.crearDesplegable(
        $('#desplegableQuienEres'),
        memoria.obtener('usuarios', false),
        'id',
        'nombre',
        usuarioActualId,
        !usuarioActualId
    );
    $('#desplegableQuienEres').off('change').change('change', function () {
        memoria.guardar('usuarioId', parseInt($(this).val()), true);
        pintarAvatar();
    });
}

function pintarAvatar() {
    let usuarioId = parseInt(memoria.obtener('usuarioId', true));
    let usuario = memoria.obtener('usuarios', false).find(usuario => usuario.id === usuarioId);
    let html = '';
    if (usuario)
        html = `<span data-usuarioid="${usuarioId}" class="${usuario.icono} fa-fw" style="color: ${usuario.color}"></span>`;
    else
        html = '<span class="fas fa-user fa-fw"></span>';
    $('#usuarioIcono').html(html);
}

function probarServidor(ip, callback) {
    if (!ip.startsWith('http'))
        ip = 'http://' + ip;
    if (!ip.endsWith('/'))
        ip += '/';
    $.ajax({
        url: ip,
        success: function (datos) {
            datos = JSON.parse(datos);
            if (datos['app'] === 'ksik')
                callback(ip);
            else
                callback();
        },
        error: function () {
            callback();
        },
        timeout: 3000
    });
}

function ponerEventosCambiarServidor() {
    // Cuando se edita el campo Servidor:
    $('#servidorIp').off('input').on('input', function () {
        // Aparece el botón de conexión:
        $('#botonConectarServidor').fadeIn();
        $('#servidorIp').removeClass('error').addClass('alerta');
    });
    // Cuando se pulsa el botón de conexión
    $('#botonConectarServidor').off('click').on('click', function () {
        probarServidor($('#servidorIp').val(), ip => {
            // Si ip !== undefined, es que se ha conectado correctamente al servidor
            if (ip) {
                $('#servidorIp').val(ip).removeClass('error').removeClass('alerta');
                $('#botonConectarServidor').fadeOut();
                memoria.guardar('servidorIp', ip, true);
                memoria.borrar('usuarioId', true);
                iniciarPagina();
            } else {
                $('#servidorIp').removeClass('alerta').addClass('error');
            }
        });
    });
}

function iniciarPagina(callback = undefined) {
    ponerEventosCambiarServidor();
    // Solo pinto los campos servidor y usuarios si hay una ip asignada como servidor
    let serverIp = memoria.obtener('servidorIp', true)
    if (serverIp) {
        $('#servidorIp').val(serverIp);
        backend.obtenerUsuarios(usuarios => {
            memoria.guardar('usuarios', usuarios, false);
            pintarDesplegableUsuarios();
            pintarAvatar();
        });
    }
    if (callback)
        callback();
}

// Evento lanzado cuando la página ha sido totalmente cargada:
window.addEventListener('load', function () {
    iniciarPagina(() => {
        $('body').fadeIn()
    });
});
