let global_categorias;
let global_usuarios;
let global_usuarioActualId;
let global_semanaNumero;
let global_semanaNumero_actual;
let global_SEMAFORO_VERDE_obtenerYPintarSemana = true;
let global_cache_semana = [];

function iniciarPagina(callback) {
    if (memoria.obtener('usuarioId', true)) {
        global_usuarioActualId = parseInt(memoria.obtener('usuarioId', true));
    }
    let llamadasAjaxRealizadas = 0;

    function intentarPintar() {
        llamadasAjaxRealizadas++;
        if (llamadasAjaxRealizadas >= 2) {
            pintarTablero();
            obtenerYPintarSemana(undefined, callback);
            setTimeout(() => {
                setInterval(() => {
                    if (!document.hidden)
                        obtenerYPintarSemana(global_semanaNumero);
                }, 250);
            }, 2000);

        }
    }

    // Llamada numero 1
    backend.obtenerUsuarios(usuarios => {
        global_usuarios = usuarios;
        intentarPintar();
    });
    // Llamada numero 2
    backend.tablero.obtenerCategorias(categorias => {
        global_categorias = categorias;
        intentarPintar();
    });
}

function obtenerYPintarSemana(semanaNumero = undefined, callback = undefined) {
    if (global_SEMAFORO_VERDE_obtenerYPintarSemana) {
        global_SEMAFORO_VERDE_obtenerYPintarSemana = false;
        backend.tablero.obtenerSemana(semanaNumero, semana => {
            if (semana) {
                _pintarSemana(semana, () => {
                    if (callback)
                        callback();
                    global_SEMAFORO_VERDE_obtenerYPintarSemana = true; // Permito que puedan volver a ejecutar esta función
                });
            } else {
                global_SEMAFORO_VERDE_obtenerYPintarSemana = true;
            }
        });
    }
}

function pintarNavegadorSemanas() {
    let html = '';

    // Flecha izquierda
    if (global_semanaNumero !== 0)
        html += '<i class="fas fa-angle-left fa-fw" onclick="cambiarDeSemana(global_semanaNumero - 1)"></i>';
    else
        html += '<i class="fas fa-angle-left fa-fw" style="opacity: 0"></i>';

    // Tag de la semana actual
    html += 'Semana ' + (global_semanaNumero + 1);
    if (global_semanaNumero === global_semanaNumero_actual)
        html += ' (actual)';

    // Flecha derecha
    if (global_semanaNumero > global_semanaNumero_actual)
        html += '<i class="fas fa-angle-right fa-fw" style="opacity: 0"></i>';
    else
        html += '<i class="fas fa-angle-right fa-fw" onclick="cambiarDeSemana(global_semanaNumero + 1)"></i>';

    // Pintar
    $('#navSemanas').html(html);
}

function cambiarDeSemana(semanaNumero) {
    if (semanaNumero < 0)
        semanaNumero = 0;
    global_semanaNumero = semanaNumero;
    obtenerYPintarSemana(semanaNumero);
    pintarNavegadorSemanas();
}

function _pintarSemana(semana, callback = undefined) {
    // Primero verifico que existan cambios entre lo que hay pintado y lo nuevo que viene en el parámetro "semana"
    // ya que el proceso de recorrer todas las celdas puede ser lento y podemos evitarlo. Cuando se cambia de
    // una semana a otra, la variable 'weekNumber' cambia y tambien entra dentro del if
    if (JSON.stringify(semana) !== JSON.stringify(global_cache_semana)) {
        // Actualizo la variable global
        global_cache_semana = semana;
        // ---------------------------------------------------------------------------
        // Pinto la barra superior:
        // global_semanaNumero solo deberá rellenarse la primera vez.
        if (global_semanaNumero === undefined) {
            global_semanaNumero = semana['weekNumber'];
            global_semanaNumero_actual = semana['weekNumber'];
        }
        pintarNavegadorSemanas();
        // ---------------------------------------------------------------------------
        // Pintar la tabla
        semana = semana['weekData'];
        // Recorro las celdas, y busco en los datos traidos del backend para poner o quitar (nunca sustituir)
        // los iconos correctos:
        global_categorias.forEach(categoria => {
            for (let dia = 0; dia < 7; dia++) {
                let celda = $(`td[data-categoriaid=${categoria.id}][data-dia=${dia}]`);
                // Una vez seleccionada una "celda", prosigo:
                // Meto en usuariosDatos los ids de los usuarios que el backend dice que debe haber en esa celda:
                let registro = semana[dia].find(registro => registro['categorieId'] === parseInt(celda.attr('data-categoriaid')));
                let usuariosDatos = registro ? registro['users'] : [];
                // Meto en usuariosCelda los ids de los usuarios que ya están pintados en la celda:
                let usuariosCelda = [];
                celda.find('i[data-usuarioid]').each((inice, iconoUsuario) =>
                    usuariosCelda.push(parseInt($(iconoUsuario).attr('data-usuarioid')))
                );
                // Ahora que tengo usuariosDatos y usuariosCelda debo poner o quitar iconos:
                // Primero agrego los que no estén pintados:
                usuariosDatos.forEach(usuarioAgregar => {
                    if (!usuariosCelda.includes(usuarioAgregar))
                        if (celda.children('i[data-usuarioid]').length > 0) // Si ya hay un usuario pintado, lo pinto justo después (pero antes que el botón +)
                            celda.children('i[data-usuarioid]').last().after(_obtenerHTMLMarcaUsuario(usuarioAgregar));
                        else // Si no hay ningun usuario pintado, lo pinto al principio (antes que el botón + (si ya existe))
                            celda.prepend((_obtenerHTMLMarcaUsuario(usuarioAgregar)));
                });
                // Ahora elimino los que estén pintados pero ya no existan en los datos del backend:
                usuariosCelda.forEach(usuarioEliminar => {
                    if (!usuariosDatos.includes(usuarioEliminar))
                        celda.find(`i[data-usuarioid="${usuarioEliminar}"]`).remove();
                });
                // Agregar o quitar el botón +:
                if (global_usuarioActualId) {
                    if (usuariosDatos.includes(global_usuarioActualId)) // Si yo ya existo en la celdo, elimino el botón (si existe):
                        celda.find('.btnAgregarMarca').remove();
                    else if (celda.find('.btnAgregarMarca').length === 0) // Si no existo en la celda y aún no hay botón de +:
                        celda.append('<i onclick="agregarSello($(this))" class="btnAgregarMarca fas fa-plus-circle fa-fw"></i>');
                }
                // Por algún motivo, a veces se duplican las entradas: // TODO Descubrir porque pasa esto. Ocurre cuando el backend se laggea y pones muchos juntos.
                global_usuarios.forEach(usuario => {
                    $(`i[data-usuarioid="${usuario.id}"] + i[data-usuarioid="${usuario.id}"]`).remove();
                });
            }

        });
    }

    if (callback)
        callback();

    // Helpers
    function _obtenerHTMLMarcaUsuario(usuarioId) {
        let usuario = global_usuarios.find(usuario => usuario.id === usuarioId);
        if (usuario) {
            if (parseInt(usuario.id) === global_usuarioActualId)
                return `<i onclick="borrarSello($(this))" data-usuarioid="${usuarioId}" class="${usuario['icono']} fa-fw" style="color: ${usuario.color}"></i>`;
            else
                return `<i data-usuarioid="${usuarioId}" class="${usuario['icono']} fa-fw" style="color: ${usuario.color}"></i>`;
        }
        return ''; //TODO Crear un icono de un usuario de color gris Default
    }
}


function agregarSello(botonJquery) {
    $('#app').addClass('inhabilitado');
    let celda = botonJquery.parent();
    let categoriaId = parseInt(celda.attr('data-categoriaid'))
    let dia = parseInt(celda.attr('data-dia'));
    backend.tablero.agregarSello(global_semanaNumero, dia, categoriaId, global_usuarioActualId, ok => {
        if (ok) {
            obtenerYPintarSemana(global_semanaNumero);
        }
        $('#app').removeClass('inhabilitado');
    });
}

function borrarSello(botonJquery) {
    $('#app').addClass('inhabilitado');
    let celda = botonJquery.parent();
    let categoriaId = parseInt(celda.attr('data-categoriaid'))
    let dia = parseInt(celda.attr('data-dia'));
    backend.tablero.borrarSello(global_semanaNumero, dia, categoriaId, global_usuarioActualId, ok => {
        if (ok) {
            obtenerYPintarSemana(global_semanaNumero);
        }
        $('#app').removeClass('inhabilitado');
    });
}


let tamanoBase = 14;
function pintarTablero() {
    let html = '';
    html += '<table>';
    html += '<tr data-colorprimario><td></td><td>Lunes</td><td>Martes</td><td>Miércoles</td><td>Jueves</td><td>Viernes</td><td>Sábado</td><td>Domingo</td></tr>';
    global_categorias.forEach(categoria => {
        html += '<tr>';

        html += '<td>';
        html += categoria['nombre'];
        html += '</td>';

        for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
            html += `<td data-categoriaid="${categoria.id}" data-dia="${diaSemana}"></td>`;
        }

        html += '</tr>';
    });
    html += '</table>';
    $('#app').append(html);
    setTimeout(() => { // TODO Meter esto en otra parte y mejorar performance
        // Inicializo la libreria de gestos
        // pan-x pan-y permite el scroll nativo: https://hammerjs.github.io/touch-action/
        let hammertime = new Hammer($('table').get(0), {touchAction: 'pan-x pan-y'});
        hammertime.get('pinch').set({enable: true});
        hammertime.on('pinch', function (ev) {
            //console.log(ev);
            // Utilizo una copia de tamanoBase para no alterarlo hasta terminar el zoom (evento de terminar mas abajo)
            let tamano = Math.round(tamanoBase * ev.scale);
            if (tamano > 20)
                tamano = 20;
            if (tamano < 5)
                tamano = 5;
            let estilos =
                `
                tr:first-child td, td:first-child {
                    font-size: ${tamano}px;
                }
                td[data-categoriaid] i {
                    font-size: ${tamano * 2}px;
                }
                `;
            $('#zoomEstilos').html(estilos);
        });
        hammertime.on('pinchend', function (ev) {
            // Obtengo el tamaño base al terminar el zoom.
            tamanoBase = Math.round(parseInt($('tr:first-child td').css('font-size').replace('px', '')));
        });
    }, 200);
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
