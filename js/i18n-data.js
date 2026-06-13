// 実験(SCENARIO_I18N)と観察モード(OBSERVE_I18N)の翻訳データ。
// 日本語(ja)は scenarios.js / universe.js / atoms.js の値を使うため、ここには en/zh/ko のみ。

export const SCENARIO_I18N = {
  en: {
    'sun-vanish': {
      title: 'What if the Sun vanished?',
      share: '☀️ The instant the Sun vanished, every planet shot off in a straight line. Inertia is merciless.',
      q: 'If the center of gravity disappeared, how would the planets move?',
      watch: 'Watch every planet fly off in a straight line, tangent to its old circular orbit.',
      explain:
        'Planets can circle the Sun because gravity is an "invisible string" pulling them inward. '
        + 'If that string snaps, each planet keeps moving <b>in a straight line at exactly the speed it had at that instant</b> (the law of inertia). '
        + 'It is just like a car that can no longer take the curve.<br><br>'
        + 'By the way, changes in gravity travel at the speed of light, so even if the Sun really did vanish, '
        + 'Earth would not "notice" it until 8 minutes 19 seconds later. Until then it keeps orbiting as if nothing happened.',
    },
    'jupiter-star': {
      title: 'What if Jupiter became a star?',
      share: '⭐ Jupiter became a second Sun — the Solar System turned into a chaotic binary.',
      q: 'What if a "second Sun" were born in the Solar System?',
      watch: 'The Sun and Jupiter become a "binary" orbiting each other, and the other planets\' orbits get disturbed.',
      explain:
        'Jupiter is called <b>"the star that never was."</b> If it were about 80 times heavier, nuclear fusion would '
        + 'ignite at its core and it would shine as a star of its own.<br><br>'
        + 'In this experiment we made Jupiter 1000 times heavier (nearly the same mass as the Sun). The Solar System then '
        + 'turns into a <b>binary system</b> in which two stars orbit their common center of mass. In the real universe, '
        + 'about half of all stars are in binaries. The planets get pulled by two giant gravities in turn, '
        + 'and their orbits become unpredictable chaos.',
    },
    'earth-stop': {
      title: 'What if Earth stopped orbiting?',
      share: '🛑 Earth stopped orbiting and fell straight into the Sun — in just ~64 days.',
      q: 'Where does Earth go once it loses its sideways speed?',
      watch: 'Earth falls straight into the Sun. Watch how many days it takes to get there.',
      explain:
        'Earth does not fall into the Sun because it is <b>"constantly falling sideways" at 30 km per second.</b> '
        + 'A circular orbit is the result of being continuously bent by gravity.<br><br>'
        + 'Lose that sideways speed, and Earth simply falls straight in, obeying gravity. '
        + 'By calculation it takes <b>about 64 days</b> to reach the Sun. The closer it gets, the stronger the gravity, '
        + 'so it accelerates faster and faster as it is drawn in.',
    },
    'earth-mercury': {
      title: "What if Earth were at Mercury's distance?",
      share: "🔥 At Mercury's orbit, Earth's year shrinks to just 88 days — the oceans boil away.",
      q: "What would Earth's 'year' be, placed right next to the Sun?",
      watch: "Earth's year gets much shorter. Note too that the orbit stays stable and keeps going.",
      explain:
        'The closer an orbit is to the Sun, the stronger the gravity, and the faster a planet must move to stay balanced. '
        + 'This is <b>Kepler\'s Third Law</b> (the square of the orbital period is proportional to the cube of the orbital radius). '
        + 'At Mercury\'s distance (0.39 AU), Earth\'s year becomes <b>just 88 days</b>.<br><br>'
        + 'It would receive about 7 times as much sunlight as now. The surface would top 400°C, the oceans would boil away, '
        + 'and life could not have existed. That Earth sits at "just the right distance" is nothing short of a miracle.',
    },
    'earth-jupiter': {
      title: 'What if Earth and Jupiter swapped?',
      share: "🪐 Swap Earth and Jupiter and both keep orbiting fine — a planet's mass barely matters to its orbit.",
      q: 'If lightweight Earth took up Jupiter\'s orbit, could it still circle properly?',
      watch: 'After the swap, both keep orbiting stably. Think about why nothing collapses.',
      explain:
        'Surprisingly, the orbits stay stable even after the swap. Orbital speed is set by '
        + '<b>only the Sun\'s mass and the orbital radius</b>; the mass of the orbiting planet itself barely matters '
        + '(the same principle as Galileo\'s "heavy and light objects fall the same way").<br><br>'
        + 'However, the Earth now at Jupiter\'s distance would have a year <b>11.9 years</b> long. Sunlight would drop to one twenty-fifth, '
        + 'and Earth would become a frozen world. Meanwhile Jupiter, brought in to 1 AU, would have stirred up the Moon and the asteroids '
        + 'with its strong gravity.',
    },
    'sun-heavy': {
      title: 'What if the Sun were twice as heavy?',
      share: '⚖️ Double the Sun’s mass and every orbit gets dragged into a long ellipse.',
      q: 'If gravity suddenly doubled, how would the orbits deform?',
      watch: "Every planet's orbit turns into an ellipse biting inward. Watch the shape of the trails.",
      explain:
        'A circular orbit is a state where "gravity" and "the momentum of going around (centrifugal force)" are perfectly balanced. '
        + 'Double the Sun\'s mass and gravity wins, dragging the planets inward into '
        + '<b>long, narrow elliptical orbits</b>.<br><br>'
        + 'On an elliptical orbit a planet moves faster the closer it is to the Sun and slower the farther away (Kepler\'s Second Law). '
        + 'Earth would become a brutal world: scorching at perihelion, frozen at aphelion. '
        + 'And by the way, if the real Sun were twice as heavy, its lifespan would be about one tenth, '
        + 'and there might not have been time for life to evolve.',
    },
    'sun-light': {
      title: 'What if the Sun were half as heavy?',
      share: '🎈 Halve the Sun’s mass and every planet drifts off on a one-way parabolic escape.',
      q: 'If gravity were halved, could the planets still be held in place?',
      watch: 'Every planet drifts away slowly, but on an orbit that never returns.',
      explain:
        'There is beautiful physics hidden here. The <b>escape velocity needed to break free of gravity is '
        + 'exactly √2 times (about 1.41×) the circular orbit speed</b>. Halve the Sun\'s mass and the escape velocity drops by a factor of √2… '
        + 'so <b>the current orbital speed becomes exactly the escape velocity</b>.<br><br>'
        + 'As a result, every planet drifts away forever on a <b>parabolic orbit</b> — neither an ellipse nor a hyperbola, but right on the boundary. '
        + 'In fact, near the end of its life the Sun will shed nearly half of its mass into space, '
        + 'so this is something that could really happen in the distant future.',
    },
    'mars-heavy': {
      title: 'What if Mars were as heavy as the Sun?',
      share: '🥊 Make Mars as heavy as the Sun and the inner Solar System collapses — chaos every time.',
      q: 'What if a super-gravity body appeared right next to Earth?',
      watch: "The inner Solar System collapses. Earth's fate is different every single time.",
      explain:
        'We made Mars as heavy as the Sun. It is as if "another Sun" appeared just outside Earth\'s orbit.<br><br>'
        + 'Gravity is inversely proportional to the square of the distance (the <b>inverse-square law</b>), so the nearer a body, '
        + 'the more violently it is pulled. When a planet passes close to a heavy body, its orbit is bent sharply and it gets accelerated. '
        + 'This is a <b>gravity assist (swing-by)</b>. The Voyager probes used this to escape the Solar System.<br><br>'
        + 'In this experiment you can watch <b>chaos</b>, where the planets get flung away, or swallowed by the Sun or by Mars, '
        + 'and the tiniest difference in the start changes the outcome.',
    },
    'all-fall': {
      title: 'What if all the planets stopped at once?',
      share: '🌠 Stop every planet at once and they fall into the Sun like dominoes, inner ones first.',
      q: 'What if all eight planets stopped orbiting at the same time?',
      watch: 'Starting with the innermost, the planets fall into the Sun one after another, like dominoes.',
      explain:
        'Planets do not fall into the Sun because their sideways speed lets them "keep falling while keeping missing." '
        + 'Take that sideways speed <b>away from every planet at once</b>, and they all fall '
        + 'straight into the Sun, obeying gravity.<br><br>'
        + 'The time it takes to fall is <b>shorter for smaller orbits</b> (Kepler\'s Third Law). '
        + 'So Mercury → Venus → Earth… are swallowed in order from the inside out, with the outer planets falling last — '
        + 'a "domino chain of falling."',
    },
    'jupiter-monster': {
      title: 'What if Jupiter were 30,000× heavier?',
      share: '🕳️ Crank Jupiter to 30,000× — the gravity king flings planets out, dragging the Sun along.',
      q: 'If Jupiter became heavier than the Sun, who is the main character?',
      watch: 'Jupiter becomes the new king of gravity. Even the Sun gets swung around, and planets are flung out one by one.',
      explain:
        'The heavier something is, the stronger its gravity — let us take that to the extreme. Make Jupiter about 30,000 times heavier '
        + '(about 30 times the Sun\'s mass) and <b>the heaviest body</b> in the Solar System becomes Jupiter, '
        + 'with the Sun getting swung around it instead.<br><br>'
        + 'The planets are torn between two mighty gravities — the Sun and Jupiter — '
        + 'and a <b>swing-by</b> accelerates them and shoots them off into space one after another. '
        + 'It is a Solar System demolition show that makes plain at a glance just how dangerous it is to be near a heavy star.',
    },
    'sun-mercury-swap': {
      title: 'What if the Sun and Mercury swapped?',
      share: '🔀 Swap the Sun with Mercury and the center of gravity goes wild — the whole system collapses.',
      q: 'What if the center of gravity suddenly jumped to the edge?',
      watch: 'The center of gravity moves, and every body comes pouring in toward the new center.',
      explain:
        'What holds the Solar System together is the strong gravity of the Sun at its center. <b>Swap that Sun, position and all,</b> '
        + 'with tiny Mercury on the inside, and the center of gravity suddenly '
        + 'jumps sideways.<br><br>'
        + 'Every planet is pulled toward "a Sun that is not where it should be," and the orbits collapse all at once. '
        + 'Some bodies get swallowed, others get flung away. '
        + 'It makes very clear that the Solar System barely holds together thanks to "that one body at the center."',
    },
  },
  zh: {
    'sun-vanish': {
      title: '假如太阳消失了',
      share: '☀️太阳消失的瞬间，行星们一齐沿直线飞向宇宙。惯性定律毫不留情。',
      q: '如果引力中心没有了，行星会怎样运动？',
      watch: '看看所有行星都沿着圆轨道的切线方向笔直飞出去。',
      explain:
        '行星之所以能绕着太阳转，是因为有引力这根「看不见的绳子」在拉着它。'
        + '一旦这根绳子断了，行星就会<b>保持那一瞬间的速度直线前进</b>（惯性定律）。'
        + '就和拐不了弯的汽车一样。<br><br>'
        + '顺便一提，引力的变化以和光相同的速度传播，所以就算太阳真的消失了，'
        + '地球「察觉」到它也要等8分19秒之后。在那之前，它会若无其事地继续公转。',
    },
    'jupiter-star': {
      title: '假如木星变成恒星',
      share: '⭐木星成了第二个太阳，太阳系变成混乱的双星系统。',
      q: '假如太阳系里诞生了「第二个太阳」？',
      watch: '太阳和木星会变成互相绕转的「双星」，其他行星的轨道则逐渐被扰乱。',
      explain:
        '木星被称为<b>「没当成的恒星」</b>。只要再重大约80倍，它的中心就会开始核聚变，'
        + '成为一颗自己发光的恒星。<br><br>'
        + '在这个实验里，我们把木星变重了1000倍（几乎和太阳一样重）。于是太阳系就变成了'
        + '两颗恒星绕着共同质心相互绕转的<b>双星系统</b>。在真实的宇宙中，'
        + '大约一半的恒星都是双星。行星们被两个巨大的引力交替拉扯，'
        + '轨道变成无法预测的混沌。',
    },
    'earth-stop': {
      title: '假如地球停止公转',
      share: '🛑地球停止公转，径直坠向太阳，仅约64天就到达。',
      q: '失去横向速度的地球会去往何处？',
      watch: '地球会笔直地坠向太阳。也请留意它大约要几天才能到达。',
      explain:
        '地球之所以不会坠入太阳，是因为它正以<b>每秒30km「持续向横侧坠落」</b>。'
        + '被引力不断弯折的结果，就是圆轨道。<br><br>'
        + '一旦失去横向速度，地球就会顺着引力笔直坠落。'
        + '据计算，到达太阳需要<b>约64天</b>。坠落得越深，引力就越强，'
        + '所以它会一边不断加速一边被吸进去。',
    },
    'earth-mercury': {
      title: '假如地球在水星的位置',
      share: '🔥放到水星位置的地球，一年只有88天，海洋被蒸发殆尽。',
      q: '被放到太阳近旁的地球，「一年」会是多久？',
      watch: '地球的一年会大幅缩短。轨道依旧稳定地继续公转，这一点也是重点。',
      explain:
        '越靠近太阳的轨道引力越强，必须转得更快才能平衡。'
        + '这就是<b>开普勒第三定律</b>（公转周期的平方与轨道半径的立方成正比）。'
        + '在水星的位置（0.39AU），地球的一年只有<b>88天</b>。<br><br>'
        + '接收到的太阳光约是现在的7倍。地表会超过400℃，海洋被蒸发，'
        + '生命也无法存在。地球处在「恰到好处的距离」，简直是个奇迹。',
    },
    'earth-jupiter': {
      title: '假如地球和木星互换',
      share: '🪐互换地球与木星，两者都照常公转。轨道与行星自身的质量几乎无关。',
      q: '如果轻巧的地球跑到木星的轨道上，还能正常绕转吗？',
      watch: '互换之后两者都会稳定地继续绕转。想一想为什么不会崩溃。',
      explain:
        '出乎意料的是，互换之后轨道依然稳定。决定公转速度的'
        + '<b>只有太阳的质量和轨道的半径</b>，与绕转行星自身的重量几乎无关'
        + '（和伽利略「重的东西和轻的东西下落得一样快」是同一个原理）。<br><br>'
        + '不过，跑到木星位置的地球，一年会长达<b>11.9年</b>。太阳光只剩二十五分之一，'
        + '地球会变成冰封的行星。反过来，来到1AU的木星，则会用强大的引力'
        + '搅乱月球和小行星。',
    },
    'sun-heavy': {
      title: '假如太阳重一倍',
      share: '⚖️太阳质量加倍，所有行星的轨道被拉成细长的椭圆。',
      q: '如果引力突然变成两倍，轨道会怎样变形？',
      watch: '所有行星的轨道都会变成向内咬进去的椭圆。请留意轨迹的形状。',
      explain:
        '圆轨道是「引力」和「绕转的势头（离心力）」恰好平衡的状态。'
        + '太阳变重一倍后引力占了上风，行星被拉向内侧，'
        + '变成<b>细长的椭圆轨道</b>。<br><br>'
        + '在椭圆轨道上，越靠近太阳动得越快，越远离动得越慢（开普勒第二定律）。'
        + '地球会变成近日点酷热、远日点严寒的严酷世界。'
        + '顺便一提，如果真正的太阳重一倍，它的寿命大约会缩短到十分之一，'
        + '生命或许就没有进化的时间了。',
    },
    'sun-light': {
      title: '假如太阳质量减半',
      share: '🎈太阳质量减半，所有行星沿抛物线轨道一去不返。',
      q: '如果引力减半，还能把行星拴住吗？',
      watch: '所有行星都会缓缓远去，但走的是一条再也回不来的轨道。',
      explain:
        '这里藏着一段优美的物理。摆脱引力所需的<b>逃逸速度，恰好是圆轨道速度的'
        + '√2倍（约1.41倍）</b>。把太阳质量减半，逃逸速度也会变成原来的√2分之一……'
        + '于是<b>现在的公转速度正好等于逃逸速度</b>。<br><br>'
        + '结果，所有行星都沿着既非椭圆也非双曲线、恰好处在临界的<b>抛物线轨道</b>'
        + '永远远去。事实上，太阳在寿命的最后会把近一半的质量抛向宇宙，'
        + '所以这在遥远的未来真的可能上演。',
    },
    'mars-heavy': {
      title: '假如火星和太阳一样重',
      share: '🥊把火星变得和太阳一样重，内太阳系崩溃，每次结局都不同。',
      q: '如果在地球紧邻处出现一个超强引力的天体？',
      watch: '内太阳系会逐渐崩溃。地球会走向怎样的命运，每次都不一样。',
      explain:
        '我们把火星变得和太阳一样重。这就相当于在地球外侧紧邻处出现了「另一个太阳」。<br><br>'
        + '引力与距离的平方成反比（<b>平方反比定律</b>），所以越近的天体被拉扯得越剧烈。'
        + '行星经过重天体附近时，轨道会被大幅弯折并被加速。'
        + '这就是<b>引力弹弓（引力助推）</b>。'
        + '旅行者号探测器就是利用它飞出太阳系的。<br><br>'
        + '在这个实验里，你能看到<b>混沌</b>：行星或被弹飞，或被太阳、火星吞没，'
        + '起初一点点细微的差别就会改变结果。',
    },
    'all-fall': {
      title: '假如所有行星同时停下',
      share: '🌠让所有行星同时停下，它们像多米诺一样从内到外坠入太阳。',
      q: '如果让八颗行星全部同时停止公转？',
      watch: '从内侧的行星开始，像多米诺骨牌一样依次坠入太阳。',
      explain:
        '行星之所以不坠入太阳，是因为它靠横向速度「一边持续坠落一边持续错开」。'
        + '一旦<b>把所有行星的横向速度一起夺走</b>，它们都会顺着引力'
        + '笔直坠向太阳。<br><br>'
        + '坠落所需的时间<b>轨道越小越短</b>（开普勒第三定律）。'
        + '所以会上演水星→金星→地球……从内到外依次被吞没、最后外侧行星才坠落的'
        + '「坠落的多米诺」。',
    },
    'jupiter-monster': {
      title: '假如木星重了三万倍',
      share: '🕳️把木星变重三万倍，引力之王连太阳一起甩动，把行星接连射向宇宙。',
      q: '如果木星变得比太阳还重，主角会是谁？',
      watch: '木星会成为新的引力之王。连太阳都被它甩来甩去，行星接连被弹飞。',
      explain:
        '越重引力越强——我们把这一点推向极端。把木星变重约三万倍'
        + '（约为太阳的30倍质量），太阳系里<b>最重的天体</b>就变成了木星，'
        + '反倒是太阳被甩着绕木星转。<br><br>'
        + '行星们被太阳和木星这两股强大的引力撕扯，'
        + '在<b>引力弹弓</b>的加速下接连被射向宇宙。'
        + '这是一场让你一眼就看清靠近重星有多危险的太阳系解体秀。',
    },
    'sun-mercury-swap': {
      title: '假如太阳和水星互换',
      share: '🔀把太阳和水星互换，引力中心失控，整个太阳系崩塌。',
      q: '如果引力中心突然飞到了边缘？',
      watch: '引力中心会移动，所有天体都朝着新的中心涌去。',
      explain:
        '把太阳系凝聚在一起的，是位于中心的太阳的强大引力。把这个太阳，'
        + '与内侧那颗小小的水星<b>连位置一起交换</b>，引力中心就会突然'
        + '飞到一旁。<br><br>'
        + '所有行星都被「本应在却不在那里的太阳」拉扯，轨道瞬间崩溃。'
        + '分成被吞没的星和被弹飞的星。'
        + '由此可以清楚看到，太阳系是靠「中心的那一个」才勉强成立的。',
    },
  },
  ko: {
    'sun-vanish': {
      title: '만약 태양이 사라진다면',
      share: '☀️태양이 사라진 순간, 행성들이 일제히 우주로 직진. 관성의 법칙은 가차없다.',
      q: '중력의 중심이 사라지면 행성은 어떻게 움직일까요?',
      watch: '모든 행성이 원궤도의 접선 방향으로 곧장 날아가는 모습을 봐요.',
      explain:
        '행성이 태양 주위를 돌 수 있는 건 중력이라는 「보이지 않는 끈」이 잡아당겨 주기 때문이에요. '
        + '그 끈이 끊어지면 행성은 <b>그 순간에 가지고 있던 속도 그대로 직진</b>합니다(관성의 법칙). '
        + '커브를 돌지 못하게 된 자동차와 똑같아요.<br><br>'
        + '참고로 중력의 변화는 빛과 같은 속도로 전해지기 때문에, 정말로 태양이 사라져도 '
        + '지구가 그것을 「알아차리는」 건 8분 19초 후예요. 그때까지는 아무 일도 없는 듯 계속 돌아요.',
    },
    'jupiter-star': {
      title: '만약 목성이 항성이 된다면',
      share: '⭐목성이 제2의 태양으로. 태양계가 혼돈의 쌍성계로 변했다.',
      q: '태양계에 「두 번째 태양」이 태어난다면?',
      watch: '태양과 목성이 서로 도는 「쌍성」이 되고, 다른 행성들의 궤도가 점점 흐트러져요.',
      explain:
        '목성은 <b>「되다 만 항성」</b>이라고 불려요. 약 80배만 더 무거웠다면 중심에서 핵융합이 '
        + '시작돼 스스로 빛나는 항성이 될 수 있었어요.<br><br>'
        + '이 실험에서는 목성을 1000배(거의 태양과 같은 무게)로 만들었어요. 그러면 태양계는 '
        + '두 항성이 공통 무게중심을 서로 도는 <b>쌍성계</b>로 바뀌어요. 실제 우주에서는 '
        + '항성의 약 절반이 쌍성이에요. 행성들은 두 거대한 중력에 번갈아 끌려다니며 '
        + '궤도가 예측 불가능한 카오스가 됩니다.',
    },
    'earth-stop': {
      title: '만약 지구가 공전을 멈춘다면',
      share: '🛑공전을 멈춘 지구가 곧장 태양으로 낙하. 도달까지 단 약 64일.',
      q: '옆 방향 속도를 잃은 지구는 어디로 갈까요?',
      watch: '지구가 곧장 태양으로 떨어져요. 며칠 만에 닿는지도 주목해 봐요.',
      explain:
        '지구가 태양으로 떨어지지 않는 건 <b>초속 30km로 「옆으로 계속 떨어지고 있기」</b> 때문이에요. '
        + '중력에 계속 휘어진 결과가 원궤도예요.<br><br>'
        + '옆 방향 속도를 잃으면 지구는 중력을 따라 곧장 떨어집니다. '
        + '계산상 태양에 도달하기까지 <b>약 64일</b>. 떨어질수록 중력이 강해지므로 '
        + '점점 가속하면서 빨려 들어가요.',
    },
    'earth-mercury': {
      title: '만약 지구가 수성 위치에 있다면',
      share: '🔥수성 위치에 놓인 지구, 1년이 단 88일로. 바다는 증발.',
      q: '태양 바로 곁에 놓인 지구의 「1년」은?',
      watch: '지구의 1년이 확 짧아져요. 궤도는 그대로 안정적으로 계속 도는 것도 포인트예요.',
      explain:
        '태양에 가까운 궤도일수록 중력이 강해서 빨리 돌지 않으면 균형이 맞지 않아요. '
        + '이것이 <b>케플러의 제3법칙</b>(공전 주기의 제곱은 궤도 반지름의 세제곱에 비례). '
        + '수성의 위치(0.39AU)에서는 지구의 1년이 <b>단 88일</b>이 됩니다.<br><br>'
        + '받는 태양빛은 지금의 약 7배. 지표는 400℃를 넘고 바다는 증발해서 '
        + '생명은 존재할 수 없었을 거예요. 지구가 「딱 알맞은 거리」에 있다는 건 기적과도 같아요.',
    },
    'earth-jupiter': {
      title: '만약 지구와 목성이 뒤바뀐다면',
      share: '🪐지구와 목성을 바꿔도 둘 다 멀쩡히 공전. 궤도엔 행성의 질량은 거의 무관.',
      q: '가벼운 지구가 목성의 궤도에 올라타면 제대로 돌 수 있을까요?',
      watch: '바꿔도 둘 다 안정적으로 계속 돌아요. 왜 무너지지 않는지 생각해 봐요.',
      explain:
        '뜻밖에도 바꿔도 궤도는 안정적이에요. 공전 속도를 정하는 건 '
        + '<b>태양의 질량과 궤도의 반지름뿐</b>이고, 돌고 있는 행성 자신의 무게는 거의 상관없기 '
        + '때문이에요(갈릴레오의 「무거운 것도 가벼운 것도 똑같이 떨어진다」와 같은 원리).<br><br>'
        + '다만 목성 위치로 간 지구의 1년은 <b>11.9년</b>의 길이가 돼요. 태양빛은 25분의 1이 되어 '
        + '지구는 얼음 행성이 됩니다. 반대로 1AU로 온 목성은 강한 중력으로 달과 소행성을 '
        + '휘저어 놓았을 거예요.',
    },
    'sun-heavy': {
      title: '만약 태양이 2배 무겁다면',
      share: '⚖️태양이 2배 무거워지자 모든 궤도가 길쭉한 타원으로 끌려든다.',
      q: '갑자기 중력이 2배가 되면 궤도는 어떻게 변형될까요?',
      watch: '모든 행성의 궤도가 안쪽으로 파고드는 타원으로 변해요. 궤적의 모양에 주목해요.',
      explain:
        '원궤도는 「중력」과 「도는 기세(원심력)」가 딱 균형을 이룬 상태예요. '
        + '태양이 2배 무거워지면 중력이 이겨서 행성이 안쪽으로 끌려들어 '
        + '<b>길쭉한 타원 궤도</b>가 됩니다.<br><br>'
        + '타원 궤도에서는 태양에 가까울수록 빠르게, 멀어질수록 느리게 움직여요(케플러의 제2법칙). '
        + '지구는 근일점에서 작열, 원일점에서 극한이라는 혹독한 세계가 될 거예요. '
        + '참고로 진짜 태양이 2배 무거웠다면 수명은 10분의 1 정도가 되어 '
        + '생명이 진화할 시간이 없었을지도 몰라요.',
    },
    'sun-light': {
      title: '만약 태양이 절반 무게가 된다면',
      share: '🎈태양이 절반 무게로. 모든 행성이 포물선 궤도로 영영 떠나간다.',
      q: '중력이 절반이 되면 행성을 붙잡아 둘 수 있을까요?',
      watch: '모든 행성이 천천히, 그러나 두 번 다시 돌아오지 않는 궤도로 멀어져 가요.',
      explain:
        '여기에는 아름다운 물리가 숨어 있어요. 중력을 떨쳐 내는 <b>탈출 속도는 원궤도 속도의 '
        + '딱 √2배(약 1.41배)</b>. 태양의 질량을 절반으로 하면 탈출 속도도 √2분의 1이 되어… '
        + '<b>지금의 공전 속도가 바로 탈출 속도</b>가 됩니다.<br><br>'
        + '그 결과 모든 행성은 타원도 쌍곡선도 아닌, 아슬아슬한 경계의 <b>포물선 궤도</b>로 '
        + '영원히 멀어져요. 실제로 태양은 수명의 마지막에 질량의 절반 가까이를 우주로 방출하므로, '
        + '이것은 먼 미래에 정말로 일어날 수 있는 모습이에요.',
    },
    'mars-heavy': {
      title: '만약 화성이 태양만큼 무겁다면',
      share: '🥊화성을 태양만큼 무겁게. 안쪽 태양계가 붕괴, 매번 다른 카오스.',
      q: '지구 바로 옆에 초중력 천체가 나타난다면?',
      watch: '안쪽 태양계가 붕괴해 가요. 지구가 어떤 운명을 걷는지는 매번 달라요.',
      explain:
        '화성을 태양과 같은 무게로 만들었어요. 지구 바로 바깥쪽에 「또 하나의 태양」이 '
        + '나타난 것과 같아요.<br><br>'
        + '중력은 거리의 제곱에 반비례하므로(<b>역제곱 법칙</b>), 가까운 천체일수록 격렬하게 '
        + '끌려가요. 행성이 무거운 천체 곁을 지나면 궤도가 크게 휘면서 '
        + '가속됩니다. 이것이 <b>스윙바이(중력 도움)</b>. '
        + '탐사선 보이저는 이것을 이용해 태양계를 탈출했어요.<br><br>'
        + '이 실험에서는 행성들이 튕겨 나가거나, 태양이나 화성에 삼켜지거나, '
        + '초기의 아주 작은 차이로 결과가 달라지는 <b>카오스</b>를 볼 수 있어요.',
    },
    'all-fall': {
      title: '만약 모든 행성이 일제히 멈춘다면',
      share: '🌠모든 행성을 동시에 멈추면 안쪽부터 도미노처럼 태양으로 낙하.',
      q: '여덟 개 행성 모두의 공전을 동시에 멈추면?',
      watch: '안쪽 행성부터 차례로, 도미노처럼 태양으로 떨어져 가요.',
      explain:
        '행성이 태양으로 떨어지지 않는 건 옆 방향 속도로 「계속 떨어지면서 계속 빗나가고 있기」 때문이에요. '
        + '그 옆 방향 속도를 <b>모든 행성에게서 한꺼번에 빼앗으면</b> 모두 중력을 따라 '
        + '곧장 태양으로 떨어집니다.<br><br>'
        + '떨어지는 데 걸리는 시간은 <b>궤도가 작을수록 짧아요</b>(케플러의 제3법칙). '
        + '그래서 수성→금성→지구…처럼 안쪽부터 차례로 삼켜지고, 마지막에 바깥 행성이 떨어지는 '
        + '「낙하의 도미노」를 볼 수 있어요.',
    },
    'jupiter-monster': {
      title: '만약 목성이 3만 배 무거워진다면',
      share: '🕳️목성을 3만 배로. 중력의 왕이 태양까지 휘두르며 행성을 우주로 날려버린다.',
      q: '목성이 태양보다 무거워지면 주인공은 어느 쪽?',
      watch: '목성이 새로운 중력의 왕으로. 태양마저 휘둘리고, 행성이 차례차례 튕겨 나가요.',
      explain:
        '무거울수록 중력이 강하다——이것을 극단적으로 해 봐요. 목성을 약 3만 배'
        + '(태양의 약 30배 질량)로 만들면 태양계에서 <b>가장 무거운 천체</b>는 목성이 되고, '
        + '오히려 태양이 목성 주위를 휘둘려 돌게 됩니다.<br><br>'
        + '행성들은 태양과 목성이라는 두 강대한 중력에 찢기며, '
        + '<b>스윙바이</b>로 가속돼 차례차례 우주로 사출됩니다. '
        + '무거운 별 근처가 얼마나 위험한지 한눈에 알 수 있는, 태양계 해체 쇼예요.',
    },
    'sun-mercury-swap': {
      title: '만약 태양과 수성이 뒤바뀐다면',
      share: '🔀태양과 수성을 바꾸자 중력 중심이 날뛰며 태양계가 전부 무너진다.',
      q: '중력의 중심이 갑자기 가장자리로 날아가 버린다면?',
      watch: '중력의 중심이 이동하고, 모든 천체가 새로운 중심으로 쏟아져 들어가요.',
      explain:
        '태양계를 하나로 묶고 있는 건 중심에 있는 태양의 강한 중력이에요. 그 태양을, '
        + '안쪽에 있는 작은 수성과 <b>위치째 맞바꾸면</b> 중력의 중심이 갑자기 '
        + '옆으로 날아가요.<br><br>'
        + '모든 행성은 「있어야 할 곳에 없는 태양」에 끌려가 궤도가 단숨에 붕괴해요. '
        + '삼켜지는 별, 튕겨 나가는 별로 갈라져 갑니다. '
        + '태양계가 「중심의 한 개」로 가까스로 성립하고 있다는 걸 잘 알 수 있어요.',
    },
  },
};

export const OBSERVE_I18N = {
  en: {
    'uEpoch0.title': '🕳 Before the Universe',
    'uEpoch0.desc': 'Neither time nor space exists yet. Press ▶ Play for the Big Bang!',
    'uEpoch1.title': '💥 Big Bang!!',
    'uEpoch1.desc': 'The beginning of the universe. From a single, super-hot, super-dense point, time and space themselves begin to expand',
    'uEpoch2.title': '🔥 The Fireball Universe',
    'uEpoch2.desc': 'In the first 3 minutes, the nuclei of hydrogen and helium are forged. Light cannot travel straight, trapped in a fog of plasma. Atoms do not yet exist — tap 🔬 to peek into the microscopic world',
    'uEpoch3.title': '✨ Recombination (the universe clears)',
    'uEpoch3.desc': '380,000 years in, atoms finally form and the universe suddenly turns transparent (see the moment with 🔬). The light released then can still be observed today as the cosmic microwave background',
    'uEpoch4.title': '🌑 The Dark Ages',
    'uEpoch4.desc': 'An age of darkness with not a single star. Gravity slowly gathers gas, preparing the raw material for the first stars',
    'uEpoch5.title': '🌟 Birth of the First Stars',
    'uEpoch5.desc': 'A few hundred million years after the birth of the universe, the first stars and tiny galaxies begin to shine a brilliant blue-white',
    'uEpoch6.title': '🌌 The Age of Galaxies',
    'uEpoch6.desc': 'Galaxies collide and merge, growing ever larger. This is the most active era of star formation in the universe (zoom in to get closer to a galaxy)',
    'uEpoch7.title': '☀️ Birth of the Solar System',
    'uEpoch7.desc': '9.2 billion years after the birth of the universe (4.6 billion years ago), the Sun and Earth were born in a corner of the Milky Way',
    'uEpoch8.title': '🌍 The Mature Universe',
    'uEpoch8.desc': 'Dark energy turns the expansion to acceleration. In the galaxies, star formation continues across the generations',
    'uEpoch9.title': '📍 The Present Universe',
    'uEpoch9.desc': '13.8 billion years after the birth of the universe. You are here',
    'uEpoch10.title': '🚀 A Future of Accelerating Expansion',
    'uEpoch10.desc': 'Dark energy makes the expansion ever faster. Galaxies drift farther and farther apart from one another',
    'uEpoch11.title': '💫 The Great Galaxy Collision',
    'uEpoch11.desc': 'About 4.5 billion years from now, the Milky Way and the Andromeda galaxy collide and merge. Around the same time the Sun swells into a red giant, then becomes a white dwarf',
    'uEpoch12.title': '🌃 The Distant Future',
    'uEpoch12.desc': 'The raw material for stars slowly dwindles, and the universe grows quietly darker (yet stars keep shining for trillions of years)',
    'u.relNone': 'No time or space yet',
    'u.relBigBang': 'The moment of the Big Bang!',
    'u.relNow': 'Now!',
    'u.timeTemplate': '{age} after the birth of the universe ({rel})',
    'u.unitSec': '{n} sec',
    'u.unitMin': '{n} min',
    'u.unitDay': '{n} days',
    'u.unitYear': '{n} years',
    'u.unitManYear': '{n}0,000 years',
    'u.unitOkuYear': '{n}00 million years',
    'u.relBefore': '{n}00 million years ago',
    'u.relAfter': '{n}00 million years from now',
    'u.milkyWay': 'Our Milky Way Galaxy',
    'aEpoch0.title': '🍲 A Scorching Soup of Particles',
    'aEpoch0.desc': 'Protons, neutrons, and electrons fly about, jostled by light. Far too hot for anything to stick together',
    'aEpoch1.title': '⚛️ Big Bang Nucleosynthesis',
    'aEpoch1.desc': 'Around 3 minutes in, the universe cools to a billion °C and protons and neutrons fuse! Helium nuclei are born one after another (flash!)',
    'aEpoch2.title': '🌫 The Plasma Fog',
    'aEpoch2.desc': 'Nuclei and electrons are still separate. Light bounces off electrons and can only zigzag along — the universe is shrouded in fog',
    'aEpoch3.title': '🎉 The Birth of Atoms!',
    'aEpoch3.desc': 'Cooling to about 3,000 °C, electrons are captured by nuclei and hydrogen and helium atoms are completed. Light can finally travel straight (recombination)',
    'aEpoch4.title': '🌌 Toward a Neutral Universe',
    'aEpoch4.desc': 'The newborn atoms drift quietly, then gather under gravity to become the raw material for the first stars',
    'a.timeTemplate': '{age} after the Big Bang (temp {temp})',
    'a.unitSec': '{n} sec',
    'a.unitMin': '{n} min',
    'a.unitDay': '{n} days',
    'a.unitYear': '{n} years',
    'a.unitManYear': '{n}0,000 years',
    'a.tempOku': 'approx. {n}00 million °C',
    'a.tempMan': 'approx. {n}0,000 °C',
    'a.tempPlain': 'approx. {n} °C',
    'galaxy.now': 'The galaxy now',
    'galaxy.after': 'The galaxy {label} from now',
    'galaxy.before': 'The galaxy {label} ago',
    'galaxy.unitOku': '{n}00 million years',
    'galaxy.unitMyr': '{n} million years',
  },
  zh: {
    'uEpoch0.title': '🕳 宇宙诞生之前',
    'uEpoch0.desc': '时间与空间都尚不存在。点击 ▶ 播放，开启大爆炸!',
    'uEpoch1.title': '💥 大爆炸!!',
    'uEpoch1.desc': '宇宙的开端。从一个超高温、超高密度的点开始，时间与空间本身开始膨胀',
    'uEpoch2.title': '🔥 火球宇宙',
    'uEpoch2.desc': '最初的3分钟内，氢与氦的原子核形成。光被等离子体的浓雾阻挡，无法直线前进。此时原子尚未存在——点击 🔬 一窥微观世界吧',
    'uEpoch3.title': '✨ 宇宙放晴(复合时期)',
    'uEpoch3.desc': '38万年后，原子终于诞生，宇宙骤然变得透明(可用 🔬 看到这一瞬间)。此时释放的光，如今仍能作为宇宙微波背景辐射被观测到',
    'uEpoch4.title': '🌑 黑暗时代',
    'uEpoch4.desc': '还没有一颗恒星的黑暗时代。引力一点点聚拢气体，为恒星准备着原料',
    'uEpoch5.title': '🌟 第一批恒星的诞生',
    'uEpoch5.desc': '宇宙诞生数亿年后，第一代恒星与小型星系开始发出青白色的光芒',
    'uEpoch6.title': '🌌 星系的时代',
    'uEpoch6.desc': '星系相互碰撞、合并，不断壮大。这是宇宙中恒星诞生最旺盛的时代(可放大靠近星系)',
    'uEpoch7.title': '☀️ 太阳系的诞生',
    'uEpoch7.desc': '宇宙诞生92亿年后(距今46亿年前)，太阳与地球在银河系的一隅诞生',
    'uEpoch8.title': '🌍 成熟的宇宙',
    'uEpoch8.desc': '暗能量使膨胀转为加速。星系中恒星新旧更替，造星活动持续进行',
    'uEpoch9.title': '📍 现在的宇宙',
    'uEpoch9.desc': '宇宙诞生138亿年。你就在这里',
    'uEpoch10.title': '🚀 加速膨胀的未来',
    'uEpoch10.desc': '在暗能量作用下，膨胀越来越快。星系彼此越来越远',
    'uEpoch11.title': '💫 星系大碰撞',
    'uEpoch11.desc': '距今约45亿年后，银河系与仙女座星系碰撞合并。大约同时，太阳膨胀为红巨星，随后变为白矮星',
    'uEpoch12.title': '🌃 遥远的未来',
    'uEpoch12.desc': '造星的原料逐渐减少，宇宙慢慢变得昏暗而寂静(但恒星仍会持续闪耀数万亿年)',
    'u.relNone': '还没有时间与空间',
    'u.relBigBang': '大爆炸的瞬间!',
    'u.relNow': '此刻!',
    'u.timeTemplate': '宇宙诞生后{age}({rel})',
    'u.unitSec': '{n}秒',
    'u.unitMin': '{n}分钟',
    'u.unitDay': '{n}天',
    'u.unitYear': '{n}年',
    'u.unitManYear': '{n}万年',
    'u.unitOkuYear': '{n}亿年',
    'u.relBefore': '{n}亿年前',
    'u.relAfter': '{n}亿年后',
    'u.milkyWay': '我们的银河系',
    'aEpoch0.title': '🍲 灼热的基本粒子汤',
    'aEpoch0.desc': '质子、中子、电子被光裹挟着四处飞窜。太热了，什么都粘不到一起',
    'aEpoch1.title': '⚛️ 大爆炸核合成',
    'aEpoch1.desc': '约3分钟时，宇宙冷却到10亿℃，质子与中子开始结合!氦原子核接连诞生(噗的一闪)',
    'aEpoch2.title': '🌫 等离子体浓雾',
    'aEpoch2.desc': '原子核与电子仍各自分离。光不断撞上电子，只能曲折地前进，宇宙笼罩在雾中',
    'aEpoch3.title': '🎉 原子的诞生!',
    'aEpoch3.desc': '冷却到约3000℃时，电子被原子核俘获，氢与氦的原子就此形成。光终于能够直线前进(宇宙放晴)',
    'aEpoch4.title': '🌌 走向中性的宇宙',
    'aEpoch4.desc': '新生的原子静静飘荡，终将在引力作用下聚集，成为第一批恒星的原料',
    'a.timeTemplate': '大爆炸后{age}(温度 {temp})',
    'a.unitSec': '{n}秒',
    'a.unitMin': '{n}分钟',
    'a.unitDay': '{n}天',
    'a.unitYear': '{n}年',
    'a.unitManYear': '{n}万年',
    'a.tempOku': '约{n}亿℃',
    'a.tempMan': '约{n}万℃',
    'a.tempPlain': '约{n}℃',
    'galaxy.now': '现在的银河系',
    'galaxy.after': '{label}后的银河系',
    'galaxy.before': '{label}前的银河系',
    'galaxy.unitOku': '{n}亿年',
    'galaxy.unitMyr': '{n}百万年',
  },
  ko: {
    'uEpoch0.title': '🕳 우주 탄생 이전',
    'uEpoch0.desc': '시간도 공간도 아직 존재하지 않습니다. ▶ 재생 을 누르면 빅뱅!',
    'uEpoch1.title': '💥 빅뱅!!',
    'uEpoch1.desc': '우주의 시작. 초고온·초고밀도의 한 점에서 시간과 공간 그 자체가 팽창하기 시작합니다',
    'uEpoch2.title': '🔥 불덩이 우주',
    'uEpoch2.desc': '처음 3분 동안 수소와 헬륨의 원자핵이 만들어집니다. 빛은 플라스마 안개에 막혀 똑바로 나아가지 못합니다. 원자는 아직 존재하지 않습니다 — 🔬 로 미시 세계를 들여다보세요',
    'uEpoch3.title': '✨ 우주의 맑게 갬(재결합)',
    'uEpoch3.desc': '38만 년 후, 마침내 원자가 생겨 우주가 갑자기 투명해집니다(🔬 로 그 순간을 볼 수 있습니다). 이때 방출된 빛은 지금도 우주 마이크로파 배경 복사로 관측할 수 있습니다',
    'uEpoch4.title': '🌑 암흑시대',
    'uEpoch4.desc': '아직 별이 하나도 없는 어둠의 시대. 중력이 조금씩 가스를 모아 별의 재료를 준비해 갑니다',
    'uEpoch5.title': '🌟 최초의 별들의 탄생',
    'uEpoch5.desc': '우주 탄생으로부터 수억 년, 첫 세대 별(초기 별)과 작은 은하들이 푸르스름하게 빛나기 시작합니다',
    'uEpoch6.title': '🌌 은하의 시대',
    'uEpoch6.desc': '은하들이 충돌·병합하며 크게 성장해 갑니다. 우주에서 별의 탄생이 가장 활발한 시대입니다(확대해 은하에 다가갈 수 있습니다)',
    'uEpoch7.title': '☀️ 태양계의 탄생',
    'uEpoch7.desc': '우주 탄생으로부터 92억 년(지금으로부터 46억 년 전), 우리 은하 한구석에서 태양과 지구가 태어났습니다',
    'uEpoch8.title': '🌍 성숙한 우주',
    'uEpoch8.desc': '암흑 에너지에 의해 팽창이 가속으로 전환됩니다. 은하에서는 세대교체를 거듭하며 별 만들기가 이어집니다',
    'uEpoch9.title': '📍 현재의 우주',
    'uEpoch9.desc': '우주 탄생으로부터 138억 년. 당신은 여기에 있습니다',
    'uEpoch10.title': '🚀 가속 팽창의 미래',
    'uEpoch10.desc': '암흑 에너지로 팽창은 점점 빨라집니다. 은하들은 서로 점점 멀어져 갑니다',
    'uEpoch11.title': '💫 은하의 대충돌',
    'uEpoch11.desc': '지금으로부터 약 45억 년 후, 우리 은하와 안드로메다 은하가 충돌·병합합니다. 같은 무렵 태양은 적색거성이 되고, 이후 백색왜성이 됩니다',
    'uEpoch12.title': '🌃 먼 미래',
    'uEpoch12.desc': '별의 재료는 조금씩 줄어들고, 우주는 천천히 어둡고 고요해져 갑니다(그래도 별은 수조 년이나 계속 빛납니다)',
    'u.relNone': '아직 시간도 공간도 없음',
    'u.relBigBang': '빅뱅의 순간!',
    'u.relNow': '지금!',
    'u.timeTemplate': '우주 탄생으로부터 {age} ({rel})',
    'u.unitSec': '{n}초',
    'u.unitMin': '{n}분',
    'u.unitDay': '{n}일',
    'u.unitYear': '{n}년',
    'u.unitManYear': '{n}만 년',
    'u.unitOkuYear': '{n}억 년',
    'u.relBefore': '{n}억 년 전',
    'u.relAfter': '{n}억 년 후',
    'u.milkyWay': '우리 은하 (은하수)',
    'aEpoch0.title': '🍲 작열하는 소립자 수프',
    'aEpoch0.desc': '양성자·중성자·전자가 빛에 휩쓸려 날아다닙니다. 너무 뜨거워 아무것도 달라붙지 못합니다',
    'aEpoch1.title': '⚛️ 빅뱅 핵합성',
    'aEpoch1.desc': '3분쯤, 우주가 10억 ℃까지 식으면 양성자와 중성자가 결합! 헬륨 원자핵이 잇따라 생겨납니다(반짝)',
    'aEpoch2.title': '🌫 플라스마 안개',
    'aEpoch2.desc': '원자핵과 전자는 아직 따로따로입니다. 빛은 전자에 부딪혀 지그재그로밖에 나아가지 못해, 우주는 안개 속입니다',
    'aEpoch3.title': '🎉 원자의 탄생!',
    'aEpoch3.desc': '약 3000 ℃까지 식으면 전자가 원자핵에 붙잡혀 수소와 헬륨의 원자가 완성됩니다. 빛은 똑바로 나아갈 수 있게 됩니다(맑게 갬)',
    'aEpoch4.title': '🌌 중성의 우주로',
    'aEpoch4.desc': '갓 생긴 원자들은 조용히 떠다니다, 이윽고 중력으로 모여 최초의 별의 재료가 됩니다',
    'a.timeTemplate': '빅뱅으로부터 {age} (온도 {temp})',
    'a.unitSec': '{n}초',
    'a.unitMin': '{n}분',
    'a.unitDay': '{n}일',
    'a.unitYear': '{n}년',
    'a.unitManYear': '{n}만 년',
    'a.tempOku': '약 {n}억 ℃',
    'a.tempMan': '약 {n}만 ℃',
    'a.tempPlain': '약 {n}℃',
    'galaxy.now': '현재의 우리 은하',
    'galaxy.after': '{label} 후의 우리 은하',
    'galaxy.before': '{label} 전의 우리 은하',
    'galaxy.unitOku': '{n}억 년',
    'galaxy.unitMyr': '{n}백만 년',
  },
};
