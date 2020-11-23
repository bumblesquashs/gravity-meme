/**
 Gravity point simulation nonsense
*/

// Config
const NUM_POINTS = 5
const POINT_BORDER_THICKNESS = 5
const MAX_RADIUS = 40
const MIN_RADIUS = 5
const PLAYER_RADIUS = 25

const POINT_DENSITY = 100

// Constants
const KEY_W = 119
const KEY_A = 97
const KEY_S = 115
const KEY_D = 100
const KEY_Q = 113
const KEY_F = 102

// Colours
const BACKGROUND_COLOUR = 'rgb(237, 137, 17)'
const LIGHT_COLOUR = 'rgb(240, 240, 240)'
const PLAYER_COLOUR = 'rgb(178, 28, 228)'
const PLAYER_BORDER_COLOUR = 'rgb(128, 1, 178)'

const ZERO_V = Victor(0, 0)

// Global array
let points = []

// Some state
let numRemaining = NUM_POINTS
let timeElapsed = 0

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
    return Victor(x,y).normalize()
  }
  // avoids picking too close to the edge
  function randomLocation() {
    const x = randomInt(two.width - 100) + 50 // dont get to close to the edges
    const y = randomInt(two.height - 100) + 50
    return new Victor(x, y)
  }

  // Scale a unit vector (library didnt have this)
  function scale(unitVector, scaleFactor) {
    const scaling = new Victor(scaleFactor, scaleFactor)
    return unitVector.multiply(scaling)
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
    points.push({id: id, shape: point, vel: vel, mass: mass})
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
    for (let id = 1; id < NUM_POINTS; id++) {
      const pos = randomLocation();
      const vel = scale(randomDirection(), 1)
      const radius = randomInt(MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS
      const mass = getMass(radius)
      addPoint(id, radius, pos, vel, mass)
    }
  }

  // Setup background and everything
  // Make a background (big rectangle the size of the canvas)
  const background = two.makeRectangle(Math.floor(two.width/2),
      Math.floor(two.height/2), two.width, two.height)
  background.noStroke().fill = BACKGROUND_COLOUR

  // Add a player point
  const player = two.makeCircle(two.width/2, two.height/2, PLAYER_RADIUS)
  player.fill = PLAYER_COLOUR
  player.stroke = PLAYER_BORDER_COLOUR
  points.push({id: 0, shape: player, vel: ZERO_V, mass: getMass(PLAYER_RADIUS)})

  const styles = {fill: PLAYER_COLOUR, size: 15, alignment: 'left'}
  const infoText = two.makeText("Use WASD to control. F to brake. Q for help.", 20, 10, styles);
  const timeText = two.makeText("Time Elapsed: 0:00", 20, 30, styles);
  const remainingText = two.makeText("Points left: " + NUM_POINTS, 20, 50, styles);

  // Draw points first time
  drawPoints();
  two.update();

  // Handle Keyboard presses
  $(document).on('keypress', (e) => {
    // On WASD, change player velocity
      if(e.keyCode == KEY_W){
        points[0].vel.y -= 0.2
      }
      if(e.keyCode == KEY_A){
        points[0].vel.x -= 0.2
      }
      if(e.keyCode == KEY_W){
        points[0].vel.x += 0.2
      }
      if(e.keyCode == KEY_W){
        points[0].vel.y += 0.2
      }
      if(e.keyCode == KEY_F){
        points[0].vel = scale(points[0].vel, 0.8)
      }
  });
  function step() {
    if(NUM_POINTS === 0) {
      // Reset everything for the next trial!
      console.log('Resetting!')
      drawTshapes();
      two.update();
    }
  }
});
