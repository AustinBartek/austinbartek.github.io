function main() {
    let mouseX = 0, mouseY = 0;
    const starCount = 300;

    const canvas = document.querySelector('#c');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.addEventListener("mousemove", function (evt) {
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    });

    const heart = document.getElementById("heart");
    heart.addEventListener("mouseenter", function(evt) {
        document.documentElement.style.setProperty("--heartCol", "rgb(150, 0, 0)");
    });
    heart.addEventListener("mouseleave", function(evt) {
        document.documentElement.style.setProperty("--heartCol", "rgb(255, 0, 0)");
    });

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const fragmentShader = `
#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 mousePos;
uniform float xPos[${starCount}];
uniform float yPos[${starCount}];
uniform float size[${starCount}];

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    float aspectRatio = iResolution.y / iResolution.x;
    vec2 uv = fragCoord/iResolution.xy;
    vec2 mouseUv = vec2(mousePos.x/iResolution.x, (iResolution.y-mousePos.y)/iResolution.y);

    vec2 aspectUv = uv;
    vec2 aspectMouseUv = mouseUv;
    aspectUv.y *= aspectRatio;
    aspectMouseUv.y *= aspectRatio;
    // DONE SETTING UP COORDINATES
    
    float twinkle = 1.0 - ((sin(-aspectMouseUv.x*10.0 + aspectUv.x*5.0 - iTime)+1.0)/2.0 * 0.8);

    vec3 col = vec3(0.0);
    for (int i = 0; i < xPos.length(); i++) {
        float dist = distance(aspectUv, vec2(xPos[i], yPos[i] * aspectRatio)/iResolution.xy)*1000.0/size[i]/twinkle;
        dist = pow(dist, 2.0);
        col += 1.0/dist;
    }
 
    // Output to screen
    fragColor = vec4(col,1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

    //INITIALIZING ALL THE VALUES THAT GO INTO THE SHADER HERE!!
    const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3() },
        mousePos: { value: new THREE.Vector2() },
        xPos: { type: "fv1", value: new Float32Array(starCount) },
        yPos: { type: "fv1", value: new Float32Array(starCount) },
        size: { type: "fv1", value: new Float32Array(starCount) },
    };



    function random(min, max) {
        return (Math.random() * (max - min + 1)) + min;
    }

    class Star {
        constructor(speed, position, size) {
            this.speed = speed;
            this.position = position;
            this.size = size;
        }
    }
    const stars = new Array(starCount);
    for (let i = 0; i < starCount; i++) {
        stars[i] = new Star(random(0.1, 0.25), new THREE.Vector2(random(0, canvas.width), random(0, canvas.height)), random(0.5, 2.0));
    }
    function shiftStars() {
        for (let star of stars) {
            star.position.x += star.speed;
            star.position.y -= star.speed / 5;
            if (star.position.x - star.size*10 > canvas.width || star.position.y + star.size*10 < 0 || star.position.y - star.size*10 > canvas.height) {
                if (Math.floor(Math.random() * 2) == 1) {
                    star.position.x = random(0, canvas.width);
                    star.position.y = canvas.height + star.size*10;
                } else {
                    star.position.x = -star.size*10;
                    star.position.y = random(0, canvas.height);
                }
            }
        }
    }
    function updatePositions() {
        for (let i = 0; i < stars.length; i++) {
            uniforms.xPos.value[i] = stars[i].position.x;
            uniforms.yPos.value[i] = stars[i].position.y;
        }
    }
    for (let i = 0; i < stars.length; i++) {
        uniforms.size.value[i] = stars[i].size;
    }




    const camera = new THREE.OrthographicCamera(
        -1, // left
        1, // right
        1, // top
        -1, // bottom
        -1, // near,
        1, // far
    );
    const scene = new THREE.Scene();
    const plane = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        fragmentShader,
        uniforms,
    });
    scene.add(new THREE.Mesh(plane, material));

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;  // convert to seconds
        resizeRendererToDisplaySize(renderer);

        shiftStars();

        const canvas = renderer.domElement;
        //THIS IS WHERE ALL THE INPUTS FOR THE SHADER ARE DEFINED-----------------------------------------------------------------------------
        uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
        uniforms.iTime.value = time;
        uniforms.mousePos.value.set(mouseX, mouseY);
        updatePositions();

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();