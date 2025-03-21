// Configuración de la escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Añadir luz ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Añadir un suelo
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Añadir paredes de la casa
const wallGeometry = new THREE.BoxGeometry(20, 5, 0.5);
const wallGeometrySmall = new THREE.BoxGeometry(8, 5, 0.5);
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

// Pared frontal con puerta
const frontWallLeft = new THREE.Mesh(wallGeometrySmall, wallMaterial);
frontWallLeft.position.set(-6, 2.5, -10);
scene.add(frontWallLeft);
const frontWallRight = new THREE.Mesh(wallGeometrySmall, wallMaterial);
frontWallRight.position.set(6, 2.5, -10);
scene.add(frontWallRight);

// Pared trasera
const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.set(0, 2.5, 10);
scene.add(backWall);

// Pared izquierda
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-10, 2.5, 0);
scene.add(leftWall);

// Pared derecha
const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.rotation.y = Math.PI / 2;
rightWall.position.set(10, 2.5, 0);
scene.add(rightWall);

// Tejado
const roofGeometry = new THREE.BoxGeometry(21, 0.5, 21);
const roofMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(0, 5, 0);
scene.add(roof);

// Variable para el personaje y animaciones
let character, mixer, walkAction, activeAction;
let isWalking = false;
const loader = new THREE.GLTFLoader();
loader.load(
    'resources/persona.glb',
    (gltf) => {
        character = gltf.scene;
        character.position.y = 0;
        character.scale.set(1.5, 1.5, 1.5);
        scene.add(character);

        mixer = new THREE.AnimationMixer(character);
        const animations = gltf.animations;
        console.log('Animaciones:', animations);

        if (animations && animations.length > 0) {
            animations.forEach((anim, index) => console.log(`Animación ${index}: ${anim.name}`));
            const walkAnim = animations.find(anim => anim.name.toLowerCase().includes('walk')) || animations[0];
            if (walkAnim) {
                walkAction = mixer.clipAction(walkAnim);
                walkAction.setLoop(THREE.LoopRepeat);
                walkAction.timeScale = 1;
                walkAction.time = 0;
                walkAction.paused = true;
                walkAction.play();
                mixer.update(0);
                console.log('Animación de caminar configurada:', walkAnim.name);
            } else {
                console.warn('No se encontró animación de caminar');
            }
        } else {
            console.warn('El modelo no tiene animaciones');
        }
    },
    undefined,
    (error) => console.error(error)
);

// Añadir un sofá
let sofa;
loader.load(
    'resources/sofa.glb',
    (gltf) => {
        sofa = gltf.scene;
        sofa.position.set(5, 0, 5);
        sofa.scale.set(1, 1, 1);
        scene.add(sofa);
        console.log('Sofá cargado correctamente');
    },
    undefined,
    (error) => console.error('Error al cargar el sofá:', error)
);

// Añadir una mesa
let table;
loader.load(
    'resources/muebles.glb',
    (gltf) => {
        table = gltf.scene;
        table.position.set(-5, 0, -5);
        table.scale.set(3, 3, 3);
        scene.add(table);
        console.log('Mesa cargada correctamente');
    },
    undefined,
    (error) => console.error('Error al cargar la mesa:', error)
);

// Variable para la televisión y carga del modelo 3D
let tv;
loader.load(
    'resources/tele.glb',
    (gltf) => {
        tv = gltf.scene;
        tv.position.set(0, 0, 9);
        tv.scale.set(1, 1, 1);
        tv.rotation.y = Math.PI;
        scene.add(tv);
        console.log('Televisión cargada correctamente');
    },
    undefined,
    (error) => console.error('Error al cargar la televisión:', error)
);

// Posicionar la cámara (inicial)
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Reloj para las animaciones
const clock = new THREE.Clock();

// Objeto para rastrear el estado real de las teclas
const keyStates = {
    'w': false,
    's': false,
    'a': false,
    'd': false,
    'e': false
};

// Controles básicos
const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    interact: false
};

let followCharacter = true;
let theta = Math.PI / 2;
let phi = Math.PI / 4;
let radius = 10;

// Bloquear el puntero al hacer clic en el canvas
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Detectar movimiento del mouse con Pointer Lock
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        theta -= movementX * 0.002;
        phi = Math.min(Math.PI / 2, Math.max(0.1, phi - movementY * 0.002));
    }
});

// Eventos de teclado con bloqueo estricto de Shift
document.addEventListener('keydown', (event) => {
    const key = event.key;

    // Bloquear Shift explícitamente
    if (key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') {
        event.preventDefault();
        return;
    }

    keyStates[key] = true;

    switch (key) {
        case 'w': controls.moveForward = true; break;
        case 's': controls.moveBackward = true; break;
        case 'a': controls.moveLeft = true; break;
        case 'd': controls.moveRight = true; break;
        case 'e': controls.interact = true; break;
        case 'f':
            followCharacter = !followCharacter;
            if (followCharacter) {
                radius = 10;
                theta = Math.PI / 2;
                phi = Math.PI / 4;
            }
            break;
        case 'Escape':
            document.exitPointerLock();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key;

    // Bloquear Shift explícitamente
    if (key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') {
        event.preventDefault();
        return;
    }

    keyStates[key] = false;

    switch (key) {
        case 'w': controls.moveForward = false; break;
        case 's': controls.moveBackward = false; break;
        case 'a': controls.moveLeft = false; break;
        case 'd': controls.moveRight = false; break;
        case 'e': controls.interact = false; break;
    }
});

// Detectar clic izquierdo para interactuar
renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Botón izquierdo
        controls.interact = true;
    }
});

renderer.domElement.addEventListener('mouseup', (event) => {
    if (event.button === 0) { // Botón izquierdo
        controls.interact = false;
    }
});

// Zoom con la rueda del mouse
document.addEventListener('wheel', (event) => {
    radius += event.deltaY * 0.05;
    radius = Math.max(2, Math.min(20, radius));
});

// Sistema de necesidades
let energy = 100;
const energyDisplay = document.createElement('div');
energyDisplay.style.position = 'absolute';
energyDisplay.style.top = '10px';
energyDisplay.style.left = '10px';
energyDisplay.style.color = 'white';
energyDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
energyDisplay.style.padding = '5px';
document.body.appendChild(energyDisplay);

let hunger = 100;
const hungerDisplay = document.createElement('div');
hungerDisplay.style.position = 'absolute';
hungerDisplay.style.top = '40px';
hungerDisplay.style.left = '10px';
hungerDisplay.style.color = 'white';
hungerDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
hungerDisplay.style.padding = '5px';
document.body.appendChild(hungerDisplay);

let fun = 100;
const funDisplay = document.createElement('div');
funDisplay.style.position = 'absolute';
funDisplay.style.top = '70px';
funDisplay.style.left = '10px';
funDisplay.style.color = 'white';
funDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
funDisplay.style.padding = '5px';
document.body.appendChild(funDisplay);

// Función para verificar colisiones
function checkCollision(newX, newZ) {
    const charHalfSize = 0.25;
    const obstacles = [
        { xMin: -10, xMax: -2, zMin: -10.25, zMax: -9.75 },
        { xMin: 2, xMax: 10, zMin: -10.25, zMax: -9.75 },
        { xMin: -10, xMax: 10, zMin: 9.75, zMax: 10.25 },
        { xMin: -10.25, xMax: -9.75, zMin: -10, zMax: 10 },
        { xMin: 9.75, xMax: 10.25, zMin: -10, zMax: 10 },
        { xMin: 4.5, xMax: 5.5, zMin: 4.5, zMax: 5.5 },
        { xMin: -6.5, xMax: -3.5, zMin: -6.5, zMax: -3.5 },
        { xMin: -0.5, xMax: 0.5, zMin: 8.75, zMax: 9.25 }
    ];

    for (const obstacle of obstacles) {
        if (
            newX + charHalfSize > obstacle.xMin &&
            newX - charHalfSize < obstacle.xMax &&
            newZ + charHalfSize > obstacle.zMin &&
            newZ - charHalfSize < obstacle.zMax
        ) {
            return true;
        }
    }
    return false;
}

// Función para cambiar animaciones
function setAction(newAction) {
    if (mixer && walkAction) {
        if (newAction && newAction !== activeAction) {
            if (activeAction) {
                activeAction.paused = true;
            }
            newAction.paused = false;
            newAction.play();
            activeAction = newAction;
        } else if (!newAction && activeAction) {
            activeAction.paused = true;
            activeAction.time = 0;
            mixer.update(0);
            activeAction = null;
        } else if (!newAction && !activeAction) {
            walkAction.time = 0;
            walkAction.paused = true;
            mixer.update(0);
        }

        if (activeAction && !activeAction.paused && activeAction.time > walkAction.getClip().duration - 0.1) {
            activeAction.fadeOut(0.1);
            activeAction.reset().fadeIn(0.1).play();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (character && mixer) {
        const camDirection = new THREE.Vector3();
        camera.getWorldDirection(camDirection);
        camDirection.y = 0;
        camDirection.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDirection, new THREE.Vector3(0, 1, 0)).normalize();

        const speed = 0.17; // Velocidad ajustada
        let moveX = 0;
        let moveZ = 0;

        // Sincronizar controls con keyStates en cada frame
        controls.moveForward = keyStates['w'];
        controls.moveBackward = keyStates['s'];
        controls.moveLeft = keyStates['a'];
        controls.moveRight = keyStates['d'];
        controls.interact = keyStates['e'] || controls.interact; // Permitir que el clic también active interact

        if (controls.moveForward) {
            moveX += camDirection.x * speed;
            moveZ += camDirection.z * speed;
        }
        if (controls.moveBackward) {
            moveX -= camDirection.x * speed;
            moveZ -= camDirection.z * speed;
        }
        if (controls.moveLeft) {
            moveX -= camRight.x * speed;
            moveZ -= camRight.z * speed;
        }
        if (controls.moveRight) {
            moveX += camRight.x * speed;
            moveZ += camRight.z * speed;
        }

        const newX = character.position.x + moveX;
        const newZ = character.position.z + moveZ;

        let isMoving = false;
        if (!checkCollision(newX, newZ) && (moveX !== 0 || moveZ !== 0)) {
            character.position.x = newX;
            character.position.z = newZ;
            isMoving = true;
        }

        if (isMoving) {
            const angle = Math.atan2(moveX, moveZ);
            character.rotation.y = angle;
            if (!isWalking && walkAction) {
                setAction(walkAction);
                isWalking = true;
            }
        } else {
            if (isWalking) {
                setAction(null);
                isWalking = false;
            }
        }

        energy -= 0.05;
        const distanceToSofa = character.position.distanceTo(sofa.position);
        if (distanceToSofa < 2 && controls.interact) {
            energy += 0.5;
            character.position.y = 0;
        } else {
            character.position.y = 0;
        }
        energy = Math.max(0, Math.min(100, energy));
        energyDisplay.textContent = `Energía: ${Math.round(energy)}`;

        hunger -= 0.03;
        const distanceToTable = character.position.distanceTo(table.position);
        if (distanceToTable < 2 && controls.interact) {
            hunger += 0.7;
        }
        hunger = Math.max(0, Math.min(100, hunger));
        hungerDisplay.textContent = `Hambre: ${Math.round(hunger)}`;

        fun -= 0.04;
        const distanceToTV = character.position.distanceTo(tv.position);
        if (distanceToTV < 2 && controls.interact) {
            fun += 0.6;
        }
        fun = Math.max(0, Math.min(100, fun));
        funDisplay.textContent = `Diversión: ${Math.round(fun)}`;

        if (followCharacter) {
            camera.position.x = character.position.x + radius * Math.sin(theta) * Math.cos(phi);
            camera.position.y = character.position.y + radius * Math.sin(phi);
            camera.position.z = character.position.z + radius * Math.cos(theta) * Math.cos(phi);
            camera.lookAt(character.position);
        } else {
            camera.lookAt(character.position);
        }

        if (activeAction && !activeAction.paused) {
            mixer.update(delta);
        }
    }

    renderer.render(scene, camera);
}
animate();

// Ajustar el tamaño si la ventana cambia
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Limpiar estados al perder el foco
window.addEventListener('blur', () => {
    keyStates['w'] = false;
    keyStates['s'] = false;
    keyStates['a'] = false;
    keyStates['d'] = false;
    keyStates['e'] = false;
    controls.moveForward = false;
    controls.moveBackward = false;
    controls.moveLeft = false;
    controls.moveRight = false;
    controls.interact = false;
});