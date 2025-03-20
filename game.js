// Configuración de la escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Añadir luz ambiental (para que el modelo no se vea negro)
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

// Variable para el personaje (modelo 3D) y animaciones
let character;
let mixer; // Para manejar las animaciones
let idleAction, walkAction; // Acciones de animación
let activeAction; // Acción actualmente activa
const loader = new THREE.GLTFLoader();

loader.load(
    'resources/persona.glb', // Ruta al modelo con animaciones
    (gltf) => {
        character = gltf.scene;
        character.position.y = 0; // Posición inicial en el suelo
        character.scale.set(1, 1, 1); // Escala inicial (ajusta si es necesario)

        // Configurar animaciones
        mixer = new THREE.AnimationMixer(character);
        const animations = gltf.animations;

        if (animations && animations.length > 0) {
            console.log('Animaciones disponibles:', animations);
            // Buscar animaciones "Idle" y "Walk"
            idleAction = mixer.clipAction(animations.find(anim => anim.name.toLowerCase().includes('idle')) || animations[0]);
            walkAction = mixer.clipAction(animations.find(anim => anim.name.toLowerCase().includes('walk')) || animations[1]);

            // Configurar acciones
            idleAction.play(); // Reproducir "Idle" por defecto
            activeAction = idleAction;

            // Asegurarse de que las animaciones no se sobrepongan
            idleAction.setLoop(THREE.LoopRepeat);
            walkAction.setLoop(THREE.LoopRepeat);
        } else {
            console.warn('El modelo no tiene animaciones');
        }

        scene.add(character);
        console.log('Personaje cargado correctamente');
    },
    (progress) => {
        console.log(`Cargando: ${(progress.loaded / progress.total) * 100}%`);
    },
    (error) => {
        console.error('Error al cargar el modelo:', error);
    }
);

// Añadir una silla (cubo azul)
const chairGeometry = new THREE.BoxGeometry(1, 1, 1);
const chairMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const chair = new THREE.Mesh(chairGeometry, chairMaterial);
chair.position.set(5, 0.5, 5);
scene.add(chair);

// Añadir una mesa (cubo marrón)
const tableGeometry = new THREE.BoxGeometry(2, 1, 1);
const tableMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.position.set(-5, 0.5, -5);
scene.add(table);

// Añadir un televisor (cubo gris)
const tvGeometry = new THREE.BoxGeometry(2, 1, 0.5);
const tvMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
const tv = new THREE.Mesh(tvGeometry, tvMaterial);
tv.position.set(0, 0.5, 8);
scene.add(tv);

// Posicionar la cámara (inicial)
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Reloj para las animaciones
const clock = new THREE.Clock();

// Controles básicos
const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    interact: false
};

let followCharacter = true;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let theta = Math.PI / 2;
let phi = Math.PI / 4;
let radius = 10;

document.addEventListener('keydown', (event) => {
    switch (event.key) {
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
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w': controls.moveForward = false; break;
        case 's': controls.moveBackward = false; break;
        case 'a': controls.moveLeft = false; break;
        case 'd': controls.moveRight = false; break;
        case 'e': controls.interact = false; break;
    }
});

// Controles del mouse
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

document.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        theta -= deltaX * 0.005;
        phi = Math.min(Math.PI / 2, Math.max(0.1, phi - deltaY * 0.005));
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

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
    const charHalfSize = 0.5;

    const walls = [
        { xMin: -10, xMax: -2, zMin: -10.25, zMax: -9.75 },
        { xMin: 2, xMax: 10, zMin: -10.25, zMax: -9.75 },
        { xMin: -10, xMax: 10, zMin: 9.75, zMax: 10.25 },
        { xMin: -10.25, xMax: -9.75, zMin: -10, zMax: 10 },
        { xMin: 9.75, xMax: 10.25, zMin: -10, zMax: 10 }
    ];

    for (const wall of walls) {
        if (
            newX + charHalfSize > wall.xMin &&
            newX - charHalfSize < wall.xMax &&
            newZ + charHalfSize > wall.zMin &&
            newZ - charHalfSize < wall.zMax
        ) {
            return true;
        }
    }
    return false;
}

// Función para cambiar animaciones
function setAction(newAction) {
    if (newAction !== activeAction && mixer) {
        activeAction.fadeOut(0.2); // Transición suave
        newAction.reset().fadeIn(0.2).play();
        activeAction = newAction;
    }
}

// Función de animación
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Tiempo transcurrido para las animaciones

    if (character && mixer) { // Solo ejecuta si el personaje y el mixer están cargados
        // Calcular la dirección de la cámara en el plano XZ
        const camDirection = new THREE.Vector3();
        camera.getWorldDirection(camDirection);
        camDirection.y = 0;
        camDirection.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDirection, new THREE.Vector3(0, 1, 0)).normalize();

        const speed = 0.1;
        let moveX = 0;
        let moveZ = 0;

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
        if (!checkCollision(newX, character.position.z)) {
            character.position.x = newX;
            isMoving = true;
        }
        if (!checkCollision(character.position.x, newZ)) {
            character.position.z = newZ;
            isMoving = true;
        }

        // Rotar el personaje para que mire en la dirección del movimiento
        if (isMoving && (moveX !== 0 || moveZ !== 0)) {
            const angle = Math.atan2(moveX, moveZ);
            character.rotation.y = angle;
            setAction(walkAction); // Reproducir animación de caminar
        } else {
            setAction(idleAction); // Reproducir animación de estar quieto
        }

        // Sistema de energía
        energy -= 0.05;
        const distanceToChair = character.position.distanceTo(chair.position);
        if (distanceToChair < 2 && controls.interact) {
            energy += 0.5;
            character.position.y = 0;
        } else {
            character.position.y = 0;
        }
        energy = Math.max(0, Math.min(100, energy));
        energyDisplay.textContent = `Energía: ${Math.round(energy)}`;

        // Sistema de hambre
        hunger -= 0.03;
        const distanceToTable = character.position.distanceTo(table.position);
        if (distanceToTable < 2 && controls.interact) {
            hunger += 0.7;
        }
        hunger = Math.max(0, Math.min(100, hunger));
        hungerDisplay.textContent = `Hambre: ${Math.round(hunger)}`;

        // Sistema de diversión
        fun -= 0.04;
        const distanceToTV = character.position.distanceTo(tv.position);
        if (distanceToTV < 2 && controls.interact) {
            fun += 0.6;
        }
        fun = Math.max(0, Math.min(100, fun));
        funDisplay.textContent = `Diversión: ${Math.round(fun)}`;

        // Actualizar posición de la cámara (tercera persona)
        if (followCharacter) {
            camera.position.x = character.position.x + radius * Math.sin(theta) * Math.cos(phi);
            camera.position.y = character.position.y + radius * Math.sin(phi);
            camera.position.z = character.position.z + radius * Math.cos(theta) * Math.cos(phi);
            camera.lookAt(character.position);
        } else {
            camera.lookAt(character.position);
        }

        // Actualizar animaciones
        mixer.update(delta);
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