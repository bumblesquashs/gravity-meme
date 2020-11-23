/**
 Gravity point simulation nonsense
*/

// Config
const NUM_POINTS = 10
const POINT_BORDER_THICKNESS = 5
const MAX_RADIUS = 40
const MIN_RADIUS = 5
const PLAYER_RADIUS = 25

const KEY_STRENGTH = 20

const POINT_DENSITY = 15

// Constants
const KEY_W = 87 // 119
const KEY_A = 65 // 97
const KEY_S = 83 // 115
const KEY_D = 68 // 100
const KEY_Q = 81 // 113
const KEY_R = 82 // 114
const KEY_F = 70 // 102

GRAVITY = 6.67e-11 * 3e9 // Scale up by a billion or so just to help things out

// Colours
const BACKGROUND_COLOUR = 'rgb(237, 137, 17)'
const LIGHT_COLOUR = 'rgb(240, 240, 240)'
const PLAYER_COLOUR = 'rgb(178, 28, 228)'
const PLAYER_BORDER_COLOUR = 'rgb(128, 1, 178)'

// Global array
let points = []

// Some state
let numRemaining = NUM_POINTS
let timeElapsed = 0
let timeElapsedMs = 0

// Runs after page loads
$(function() {

  // Start graphics up
  const two = new Two({
    fullscreen: true,
    autostart: true
  }).appendTo(document.body);

  // helper for getting random ints up to but not including max
  function randomInt(max){
    return Math.floor(Math.random() * max)
  }

  // mass given radius
  function getMass(radius) {
    const area = Math.PI * radius**2
    return POINT_DENSITY * area
  }

  // random darker grey
  function getRandomShade() {
    darkness = randomInt(128) + 32
    return `rgb(${darkness}, ${darkness}, ${darkness})`;
  }

  // get random direction as a vector
  function randomDirection() {
    const x = Math.random()
    const y = Math.random()
    return new Two.Vector(x,y).normalize()
  }
  // avoids picking too close to the edge
  function randomLocation() {
    const x = randomInt(two.width - 100) + 50 // dont get to close to the edges
    const y = randomInt(two.height - 100) + 50
    return new Two.Vector(x, y)
  }
  // Helper to write the time string to the screen
  function getTimeString(time) {
    const secs = time % 60
    const mins = Math.floor(time / 60)
    const secsString = secs >= 10 ? `${secs}` : `0${secs}`
    return `Time Elapsed: ${mins}:${secsString}`
  }

  // Draws a new point and adds to array
  function addPoint(id, radius, pos, vel, mass) {
    // Place point
    const point = two.makeCircle(pos.x, pos.y, radius)
    // Pick a random colour
    const fill = getRandomShade()
    const border = getRandomShade()
    point.fill = fill
    point.stroke = border
    point.linewidth = POINT_BORDER_THICKNESS
    // Save this points and info, into a list of shapes
    points.push({id: id, shape: point, pos: pos, vel: vel, mass: mass, dead: 0})
  }

  // Draw all the points
  function drawPoints(){
    // Clear out all the old ones except the player
    for (point of points) {
      if(point.id > 0) {
        point.shape.remove();
      }
    }
    points = [points[0]] // just preserve player

    // Draw a bunch of random points, player is id 0
    for (let id = 1; id <= NUM_POINTS; id++) {
      const pos = randomLocation();
      const radius = randomInt(MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS
      const mass = getMass(radius)
      const vel = new Two.Vector(0, 0)
      addPoint(id, radius, pos, vel, mass)
    }
  }

  // Setup background and everything
  // Make a background (big rectangle the size of the canvas)
  const background = two.makeRectangle(Math.floor(two.width/2),
      Math.floor(two.height/2), two.width, two.height)
  background.noStroke().fill = BACKGROUND_COLOUR

  // Add a player point
  const startingPoint = new Two.Vector(two.width/2, two.height/2)
  const player = two.makeCircle(startingPoint.x, startingPoint.y, PLAYER_RADIUS)
  player.fill = PLAYER_COLOUR
  player.stroke = PLAYER_BORDER_COLOUR
  player.linewidth = POINT_BORDER_THICKNESS
  points.push({id: 0, shape: player, pos: startingPoint, vel: new Two.Vector(0,0), mass: getMass(PLAYER_RADIUS)})

  const styles = {fill: PLAYER_COLOUR, size: 15, alignment: 'left'}
  const infoText = two.makeText("Use WASD to control. F to brake. R to reset.", 20, 10, styles);
  const timeText = two.makeText("Time Elapsed: 0:00", 20, 30, styles);
  const remainingText = two.makeText("Points left: " + NUM_POINTS, 20, 50, styles);

  // Draw points first time
  drawPoints();
  two.update();

  // Handle Keyboard presses
  $(document).on('keydown', (e) => {
    // On WASD, change player velocity
      if(e.keyCode == KEY_W){
        points[0].vel.y -= KEY_STRENGTH
      }
      if(e.keyCode == KEY_A){
        points[0].vel.x -= KEY_STRENGTH
      }
      if(e.keyCode == KEY_S){
        points[0].vel.y += KEY_STRENGTH
      }
      if(e.keyCode == KEY_D){
        points[0].vel.x += KEY_STRENGTH
      }
      if(e.keyCode == KEY_F){
        points[0].vel = points[0].vel.multiplyScalar(0.8)
      }
      if(e.keyCode == KEY_R){
        points[0].vel = new Two.Vector(0, 0)
        points[0].pos = new Two.Vector(two.width/2, two.height/2)
      }
  });

  function isOffscreen(point) {
    return (point.pos.x < -50
      || point.pos.x > (two.width + 50)
      || point.pos.y < -50
      || point.pos.y > (two.height + 50))
  }
  // Here is the real physics!
  function movePoints(dt) {
    for(us of points){
      // Don't simulate dead points
      if(us.dead){
        continue
      }
      // Set points as dead if they are offscreen and not us
      if(isOffscreen(us) && us.id !== 0){
        console.log('got here')
        us.dead = 1
        numRemaining -= 1
      }
      let netForce = new Two.Vector(0, 0) // start with empty force
      for(them of points) {
        // get contributions from all other shapes
        if(us.id === them.id) {
          continue // don't interact with ourself
        }
        // add force
        // F = Gm1m2/r^2
        const theirPos = them.pos.clone()
        const ourPos = us.pos.clone()
        const r = theirPos.subtract(ourPos) // vector subtraction
        const distance = r.length() // magnitude
        const forceMagnitude = (GRAVITY * us.mass * them.mass) / (distance**2)
        r.normalize()
        const force = r.multiplyScalar(forceMagnitude);
        netForce.add(force) // add the scaled new force vector to the current force
      }

      // Fnet = ma => a = Fnet/m
      const accel = netForce.divideScalar(us.mass)
      // Update Velocity: deltav = a * deltat
      us.vel.add(accel.multiplyScalar(dt))
      // Update Position: distance travelled = v * deltat
      us.pos.add(new Two.Vector(us.vel.x * dt, us.vel.y * dt))
      us.shape.translation.set(us.pos.x, us.pos.y);

    }
  }
  function step(frameCount, timeDelta) {
    timeElapsedMs += timeDelta
    movePoints(timeDelta/1000) // this needs to be in seconds
    if(timeElapsedMs >= 1000) {
      timeElapsedMs = 0
      timeElapsed += 1
      timeText.value = getTimeString(timeElapsed)
    }
    remainingText.value = "Points left: " + numRemaining

    if(numRemaining === 0) {
      // Reset everything for the next trial!
      console.log('Resetting All!')
      timeElapsed = 0
      timeElapsedMs = 0
      numRemaining = NUM_POINTS
      points[0].vel = new Two.Vector(0, 0)
      points[0].pos = new Two.Vector(two.width/2, two.height/2)
      drawPoints();
      two.update();
    }
  }

  two.bind('update', step).play();

});
