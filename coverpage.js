(function () {
  const canvas = document.getElementById('cover-canvas');
  const cover = canvas.parentElement;
  const W = () => cover.clientWidth, H = () => cover.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x0a0a08);

  const scene = new THREE.Scene();
  const maskScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 5);

  let renderTarget = new THREE.WebGLRenderTarget(W(), H());
  let maskTarget = new THREE.WebGLRenderTarget(W(), H());

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.85, metalness: 0.05 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a843, roughness: 0.4, metalness: 0.6 });
  const sunMat = new THREE.MeshStandardMaterial({ color: 0xeae2b2, roughness: 0.4, metalness: 0.6 });
  const maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  function createQuipuStrand(yOff, xOff, zOff, knots) {
    const g = new THREE.Group();
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.5 + yOff, zOff),
      new THREE.Vector3(xOff * 0.3, 1.5 + yOff, zOff + 0.2),
      new THREE.Vector3(xOff * -0.2, 0.5 + yOff, zOff - 0.1),
      new THREE.Vector3(xOff * 0.1, -0.5 + yOff, zOff + 0.15),
      new THREE.Vector3(0, -1.5 + yOff, zOff),
      new THREE.Vector3(xOff * -0.15, -2.5 + yOff, zOff - 0.2),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.025, 8, false), stoneMat));
    for (let i = 0; i < knots; i++) {
      const pos = c.getPoint(0.15 + (i / knots) * 0.7);
      const k = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 8, 12), stoneMat);
      k.position.copy(pos);
      k.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      g.add(k);
    }
    return g;
  }

  const quipu = new THREE.Group();
  const cord = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2, 2.0, 0),
    new THREE.Vector3(-0.6, 2.25, 0.1),
    new THREE.Vector3(0.6, 2.15, -0.1),
    new THREE.Vector3(2.2, 2.0, 0),
  ]);
  quipu.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 64, 0.04, 8, false), stoneMat));
  for (let i = 0; i < 11; i++) {
    const t = 0.06 + (i / 10) * 0.88;
    const a = cord.getPoint(t);
    const s = createQuipuStrand(a.y - 2.5, a.x, a.z + (Math.random() - 0.5) * 0.25, 2 + Math.floor(Math.random() * 4));
    s.position.x = a.x;
    quipu.add(s);
  }
  quipu.position.set(0, 0.3, -1.5);
  scene.add(quipu);

  function createInti(r, mat) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.06, 32), mat);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);

    const detailMat = mat === maskMat ? maskMat : new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 1 });
    [[-r * 0.12, r * 0.05], [r * 0.12, r * 0.05]].forEach(([x, y]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(r * 0.06, 8, 8), detailMat);
      eye.position.set(x, y, 0.04);
      g.add(eye);
    });

    const mouth = new THREE.Mesh(new THREE.TorusGeometry(r * 0.08, 0.015, 8, 12, Math.PI), detailMat);
    mouth.position.set(0, -r * 0.08, 0.04);
    mouth.rotation.z = Math.PI;
    g.add(mouth);

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const wavy = i % 2 === 0;
      const len = r * (wavy ? 0.6 : 0.5);
      const w = wavy ? 0.04 : 0.06;
      let ray;
      if (wavy) {
        const shape = new THREE.Shape();
        shape.moveTo(-w, 0); shape.lineTo(0, len); shape.lineTo(w, 0); shape.closePath();
        ray = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }), mat);
        ray.position.set(Math.cos(angle) * r * 0.42, Math.sin(angle) * r * 0.42, -0.015);
      } else {
        ray = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.03), mat);
        ray.position.set(Math.cos(angle) * (r * 0.42 + len / 2), Math.sin(angle) * (r * 0.42 + len / 2), 0);
      }
      ray.rotation.z = angle - Math.PI / 2;
      g.add(ray);
    }
    return g;
  }

  const inti = createInti(1.4, sunMat);
  inti.position.set(0, 0, 1);
  scene.add(inti);

  const intiMask = createInti(1.4, maskMat);
  intiMask.position.set(0, 0, 1);
  maskScene.add(intiMask);

  const fragments = new THREE.Group();
  for (let i = 0; i < 120; i++) {
    const sz = 0.02 + Math.random() * 0.07;
    const geo = Math.random() > 0.5
      ? new THREE.TetrahedronGeometry(sz, 0)
      : new THREE.BoxGeometry(sz, sz * (0.5 + Math.random()), sz * (0.3 + Math.random() * 0.7));
    const f = new THREE.Mesh(geo, Math.random() > 0.75 ? goldMat : stoneMat);
    const angle = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 4.5;
    const y = (Math.random() - 0.5) * 6;
    f.position.set(Math.cos(angle) * r, y, (Math.random() - 0.5) * 4);
    f.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    f.userData = { speed: 0.08 + Math.random() * 0.3, offset: Math.random() * Math.PI * 2, angle, r, y };
    fragments.add(f);
  }
  scene.add(fragments);

  scene.add(new THREE.AmbientLight(0x443322, 0.5));
  const key = new THREE.DirectionalLight(0xffeedd, 1.3);
  key.position.set(3, 5, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8888aa, 0.3);
  fill.position.set(-4, -2, -3);
  scene.add(fill);
  const glow = new THREE.PointLight(0xddaa44, 0.7, 12);
  glow.position.set(0, 0, 3);
  scene.add(glow);
  maskScene.add(new THREE.AmbientLight(0xffffff, 1));

  const ditherMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tMask: { value: null },
      resolution: { value: new THREE.Vector2(W(), H()) },
      ditherScale: { value: 1.8 },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse, tMask;
      uniform vec2 resolution;
      uniform float ditherScale;
      varying vec2 vUv;
      float bayer8(vec2 p) {
        ivec2 ip = ivec2(mod(p, 8.0));
        int idx = ip.x + ip.y * 8;
        int b[64];
        b[0]=0;b[1]=32;b[2]=8;b[3]=40;b[4]=2;b[5]=34;b[6]=10;b[7]=42;
        b[8]=48;b[9]=16;b[10]=56;b[11]=24;b[12]=50;b[13]=18;b[14]=58;b[15]=26;
        b[16]=12;b[17]=44;b[18]=4;b[19]=36;b[20]=14;b[21]=46;b[22]=6;b[23]=38;
        b[24]=60;b[25]=28;b[26]=52;b[27]=20;b[28]=62;b[29]=30;b[30]=54;b[31]=22;
        b[32]=3;b[33]=35;b[34]=11;b[35]=43;b[36]=1;b[37]=33;b[38]=9;b[39]=41;
        b[40]=51;b[41]=19;b[42]=59;b[43]=27;b[44]=49;b[45]=17;b[46]=57;b[47]=25;
        b[48]=15;b[49]=47;b[50]=7;b[51]=39;b[52]=13;b[53]=45;b[54]=5;b[55]=37;
        b[56]=63;b[57]=31;b[58]=55;b[59]=23;b[60]=61;b[61]=29;b[62]=53;b[63]=21;
        int val = 0;
        for (int i = 0; i < 64; i++) { if (i == idx) val = b[i]; }
        return float(val) / 64.0;
      }
      void main() {
        float lum = dot(texture2D(tDiffuse, vUv).rgb, vec3(0.299, 0.587, 0.114));
        float mask = texture2D(tMask, vUv).r;
        vec2 centered = vUv - 0.5;
        centered.x *= resolution.x / resolution.y;
        float dist = length(centered);
        float vignette = smoothstep(0.70, 0.14, dist);
        float edgeFade = pow(vignette, 2.6);
        float d = step(bayer8(vUv * resolution / ditherScale), lum * edgeFade);
        vec3 lit = mix(vec3(0.92, 0.88, 0.80), vec3(0.95, 0.78, 0.15), mask);
        vec3 drk = mix(vec3(0.04, 0.04, 0.03), vec3(0.12, 0.08, 0.0), mask);
        vec3 col = mix(drk, lit, d) * (0.1 + 0.9 * edgeFade);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: false, depthWrite: false,
  });

  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ditherMaterial));

  function animate(time) {
    requestAnimationFrame(animate);
    const t = time * 0.001;

    quipu.rotation.y = Math.sin(t * 0.02) * 0.06;
    quipu.rotation.x = Math.sin(t * 0.014) * 0.008;

    inti.rotation.z = intiMask.rotation.z = t * 0.06;

    fragments.children.forEach(f => {
      const d = f.userData;
      f.rotation.x += 0.001 * d.speed;
      f.rotation.z += 0.0008 * d.speed;
      f.position.y = d.y + Math.sin(t * d.speed + d.offset) * 0.15;
      f.position.x = Math.cos(d.angle + t * 0.006 * d.speed) * d.r;
    });

    camera.position.x = Math.sin(t * 0.05) * 0.2;
    camera.position.y = Math.cos(t * 0.04) * 0.15;
    camera.lookAt(0, 0, 0);

    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(0x0a0a08);
    renderer.render(scene, camera);

    renderer.setRenderTarget(maskTarget);
    renderer.setClearColor(0x000000);
    renderer.render(maskScene, camera);

    ditherMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    ditherMaterial.uniforms.tMask.value = maskTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  animate(0);

  window.addEventListener('resize', () => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderTarget.setSize(W(), H());
    maskTarget.setSize(W(), H());
    ditherMaterial.uniforms.resolution.value.set(W(), H());
  });
})();
