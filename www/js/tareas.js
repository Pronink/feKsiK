let global_usuarios;
let global_usuarioActualId;
let global_cache_tareas = '';


function iniciarPagina(callback) {
    if (memoria.obtener('usuarioId', true)) {
        global_usuarioActualId = parseInt(memoria.obtener('usuarioId', true));
    }
    backend.obtenerUsuarios(usuarios => {
        global_usuarios = usuarios;
        backend.tareas.obtenerTareas(tareas => {
            pintarListaTareas(tareas);
            callback();
        });
        setTimeout(() => {
            setInterval(() => {
                if (!document.hidden) {
                    backend.tareas.obtenerTareas(tareas => {
                        pintarListaTareas(tareas);
                    });
                }
            }, 250);
        }, 2000);
    });
    // Escuchador de eventos de pulsación larga // TODO Cambiar de sitio
    document.addEventListener('long-press', function (e) {
        // Closest busca a los padres hasta llegar al padre tarea
        borrarTarea($(e.target).closest('.tarea').attr('data-created'));
    });
}


function pintarListaTareas(tareasBackend) {
    if (JSON.stringify(global_cache_tareas) === JSON.stringify(tareasBackend)) {
        return;
    } else {
        global_cache_tareas = Object.assign({}, tareasBackend);
    }
    // Recorrer tareas ya pintadas:
    $('#listaTareas > div').each((indice, $tareaJquery) => {
        $tareaJquery = $($tareaJquery);
        let laTareaCambio = false;
        let $creado = parseInt($tareaJquery.attr('data-created'));
        let tareaBackend = tareasBackend.find(tarea => tarea['created'] === $creado);
        // Si la tarea ya ha sido pintada, reviso si tiene bien puestos los sellos:
        if (tareaBackend) {
            let $usuarios = [];
            $tareaJquery.find('i[data-usuarioid]').each((indice, $usuarioSello) => {
                $usuarios.push(parseInt($($usuarioSello).attr('data-usuarioid')));
            });
            // Agregar nuevos:
            tareaBackend['users'].forEach(usuarioId => {
                if (!$usuarios.includes(usuarioId)) {
                    $tareaJquery.find('.marcas').append(_obtenerHTMLMarcaUsuario(usuarioId, tareaBackend['created']));
                    if (usuarioId === global_usuarioActualId) {
                        $tareaJquery.find('.btnAgregarMarca').remove();
                    }
                    laTareaCambio = true;
                }
            });
            // Eliminar los que ya no existen
            $usuarios.forEach(usuarioId => {
                if (!tareaBackend['users'].includes(usuarioId)) {
                    $tareaJquery.find('.marcas [data-usuarioid=' + usuarioId + ']').remove();
                    if (usuarioId === global_usuarioActualId) {
                        $tareaJquery.find('.marcas').append('<i onclick="agregarSello($(this), ' + $tareaJquery.attr('data-created') + ')" class="btnAgregarMarca fas fa-plus-circle fa-fw"></i>');
                    }
                    laTareaCambio = true;
                }
            });
            // Elimino la tarea, ya que ya ha sido pintada, y el siguiente bucle pintará las que no existan.
            tareasBackend = tareasBackend.filter(tareaItem => tareaItem['created'] !== $creado);
        } else {
            // Si la tarea que hay pintada no esta en la base de datos:
            $tareaJquery.remove();
        }
    });

    let html = '';
    tareasBackend.forEach(tarea => {
        html += '<div class="tarea" data-created="' + tarea['created'] + '">';
        html += '   <div class="informacion">';
        html += '       <div class="texto">' + tarea['text'] + '</div>';
        html += '       <div class="fechaCreacion">' + new Date(tarea['created']).toLocaleString() + '</div>';
        html += '   </div>';
        html += '   <div class="marcas">';
        tarea['users'].forEach(usuarioId => {
            html += _obtenerHTMLMarcaUsuario(usuarioId, tarea['created']);
        });
        if (!tarea['users'].includes(global_usuarioActualId))
            html += '       <i onclick="agregarSello($(this), ' + tarea['created'] + ')" class="btnAgregarMarca fas fa-plus-circle fa-fw"></i>';
        html += '   </div>';
        html += '</div>';
    });
    $('#listaTareas').prepend(html);

    // Helpers
    function _obtenerHTMLMarcaUsuario(usuarioId, momentoCreado) {
        let usuario = global_usuarios.find(usuario => usuario.id === usuarioId);
        if (usuario) {
            if (parseInt(usuario.id) === global_usuarioActualId)
                return `<i onclick="borrarSello(${momentoCreado}, ${usuarioId})" data-usuarioid="${usuarioId}" class="${usuario['icono']} fa-fw" style="color: ${usuario.color}"></i>`;
            else
                return `<i data-usuarioid="${usuarioId}" class="${usuario['icono']} fa-fw" style="color: ${usuario.color}"></i>`;
        }
        return ''; //TODO Crear un icono de un usuario de color gris Default
    }
}

function agregarTarea() {
    let texto = prompt('Contenido de la tarea:');
    if (texto && texto.trim().length > 0) {
        backend.tareas.agregarTarea(texto, global_usuarioActualId, () => {

        });
    }
}

function borrarTarea(momentoCreado) {
    if (confirm('¿Seguro que quieres borrar esa tarea?')) {
        if (momentoCreado) {
            backend.tareas.borrarTarea(momentoCreado, () => {

            });
        }
    }
}

function agregarSello(botonJquery, momentoCreado) {
    backend.tareas.agregarSello(momentoCreado, global_usuarioActualId, () => {

    });
}

function borrarSello(momentoCreado, usuarioId) {
    if (confirm('¿Seguro que quieres borrar ese registro?')) {
        backend.tareas.borrarSello(momentoCreado, usuarioId, () => {

        });
    }
}

// Evento lanzado cuando la página ha sido totalmente cargada:
window.addEventListener('load', function () {
    iniciarPagina(() => {
        $('body').fadeIn();
    });
    // Prevenir ir hacia atrás en el navegador. En el móvil la app se cierra gracias a una función en index.js
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function (event) {
        history.pushState(null, null, location.href);
    });
});