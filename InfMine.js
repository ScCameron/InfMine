/* InfMine.js
 * By Scott Cameron
 * 
 * Infinitely generating Minesweeper.
 * Left Click to uncover a tile, Right Click to flag a tile.
 * Scroll Wheel to zoom, Middle Mouse Button to move screen.
 */

// Global Vars
var SQUARE_SIZE = 50; // default size of squares in pixels
var gameOverFlag = false;
const MINE_DENSITY = 0.2; // percent of squares that contain a mine
const MOVE_SPEED = 1; // camera movement speed in pixels per frame
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


// Handle the data for each tile
class Square {
	/**
	* create a new tile, make it a mine if necessary.
	* if it's the first tile of the game, make it blank (no mine)
	* param blankTypeOverride force the tile to be blank
	*/
	constructor(blankTypeOverride = false) {
		this.isEdgeSquare = true; // the square is on the edge and is touching the void
		this.hasFlag = false;
		this.surroundNum = -1; // number of mines in the 8 tiles around it
		if(!blankTypeOverride && Math.random() < MINE_DENSITY){
			this.type = 'mine';
		}
		else {this.type = 'blank';}
	}

	// add a flag, remove flag if flag is present
	setFlag(){
		this.hasFlag = !this.hasFlag;
	}

	// the square is no longer at the edge and touching the void
	unEdgeSquare(){
		this.isEdgeSquare = false;
	}

	getType(){
		return this.type;
	}

	getIsEdgeSquare(){
		return this.isEdgeSquare;
	}

	getHasFlag(){
		return this.hasFlag;
	}

	getSurroundNum(){
		return this.surroundNum;
	}
}

// handles the grouping of all game tiles
class Grid {
	constructor(drawer) {
		// dictionary of game tiles with x, y coordinates as the key and Square object as value
		this.squareDict = {};
		this.center = [0, 0];
		this.drawer = drawer;
		this.addSquare(this.center, true); // initialize the first square to be blank
	}

	/**
	* create a new game tile and add it to the grid
	* param xy array holding the x, y location of the tile
	* param blankTypeOverride force the game tile to not contain any mines
	*/
	addSquare(xy, blankTypeOverride = false) {
		var currentSquare = this.squareDict[xy];
		// if the game tile doesnt already exist, make a new one
		if(!currentSquare){
			currentSquare = new Square(blankTypeOverride);
			this.squareDict[xy] = currentSquare;
			return currentSquare;
		}
		return undefined;
	}

	/**
	* handle the user left clicking a game tile
	* param x The x coordinate of the game tile clicked
	* param y The y coordinate of the game tile clicked
	*/ 
	gridClick(x, y){
		var currentSquare = this.squareDict[[x, y]];
		
		//if the square is allowed to be clicked
		if(currentSquare && currentSquare.getIsEdgeSquare() && !currentSquare.getHasFlag()){
			currentSquare.unEdgeSquare();
			if(x == 0 && y == 0)
				this.startingSquares();
			this.cascadeSquares([x, y]);
		}
		
		// if you click a mine, set game over status to true
		if(currentSquare && !currentSquare.getHasFlag() && currentSquare.getType() == 'mine')
			gameOverFlag = true;
	}

	/**
	* handle the user right clicking a game tile
	* param x The x coordinate of the game tile clicked
	* param y The y coordinate of the game tile clicked
	*/ 
	gridRightClick(x, y){
		var currentSquare = this.squareDict[[x, y]];
		
		// add or remove flag if applicable
		if(currentSquare && currentSquare.getIsEdgeSquare())
			currentSquare.setFlag();
	}

	/**
	* handle the uncovering of new squares when a blank tile is clicked
	* param xy array holding the x, y location of the tile
	*/ 
 	cascadeSquares(xy){
		var backlog = [xy];
		var index = 0;
		while(index < backlog.length){
			xy = backlog[index];
			this.getSquare(xy).unEdgeSquare();
			index++;
			
			// uncover the 8 surrounding game tiles around the given tile
			for(var i = -1; i < 2; i++){
				for(var j = -1; j < 2; j++){
					if(i != 0 || j != 0){
						var currentSquare = this.addSquare([xy[0]+i, xy[1]+j]);
					}
				}
			}

			// for every blank tile (0 mines around it), reveal the surrounding 8 tiles
			// repeat until there are no more blank tiles
			for(var i = -1; i < 2; i++){
				for(var j = -1; j < 2; j++){
					if(i != 0 || j != 0){
						var currentSquare = this.getSquare([xy[0]+i, xy[1]+j]);
						if(currentSquare && currentSquare.getType() != "mine"){
							var addflag = true;
							for(var backlogIndex = 0; backlogIndex < backlog.length; backlogIndex++){
								if(backlog[backlogIndex][0] == xy[0]+i && backlog[backlogIndex][1]== xy[1]+j){
									addflag = false;
									break;
								}
							}
							if(addflag && this.findSurroundNum(xy) == 0)
								backlog.push([xy[0]+i, xy[1]+j]);
						}
					}
				}
			}


		}
	}

	// create the first 9 game tiles, force them to not be mines
	startingSquares(){
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(i != 0 || j != 0){
					this.addSquare([i, j], true);
				}
			}
		}		
	}

	// create the 8 surrounding game tiles around a given tile
	createSurroundSquares(x, y){
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(i != 0 || j != 0){
					this.addSquare([x+i, y+j]);
				}
			}
		}
	}

	/**
	* get a list of the x, y coordinates for every game tile
	* return 2d array holding the x, y coordinates of every tile in the game
	*/
	getCoords() {
		var keyList = [];
		var strXY = [];
		for(var key in this.squareDict) {
			strXY = key.split(',');
			var intXY = [];
			intXY[0] = parseInt(strXY[0]);
			intXY[1] = parseInt(strXY[1]);
			keyList.push(intXY);
		}
		return keyList;
	}

	/**
	* get a specific game tile from a given coordinate
	* param xy array holding the x, y location of the tile
	* return the square object
	*/
	getSquare(xy){
		return this.squareDict[xy];
	}

	/**
	* get the text of a game tile
	* param xy array holding the x, y location of the tile
	* return the text that represents the state of the game tile
	*/
	getSquareText(xy){
		var currentSquare = this.getSquare(xy);
		if(currentSquare.getIsEdgeSquare()){
			if(currentSquare.getHasFlag())
				return "F";
			return " ";		// to differentiate between 0 square and edge square
		}
		switch(currentSquare.getType()){
			case "mine":
				return "X";
			case "wall":	// currently unimplemented
				return "|||";
			default:
				// get number of mines surrounding the tile
				var surroundNum = this.findSurroundNum(xy);
				if(surroundNum == 0)
					return "";
				else return surroundNum;
		}
	}

	/**
	* Get number of mines surrounding the tile
	* param xy array holding the x, y location of the tile
	* return 
	*/
	findSurroundNum(xy){
		var x = xy[0];
		var y = xy[1];
		var currentSquare = this.squareDict[xy];
		if(currentSquare.getSurroundNum() < 0){
			var count = 0;
			// check the surrounding 8 squares
			for(var i = -1; i < 2; i++){
				for(var j = -1; j < 2; j++){
					if(i != 0 || j != 0){
						if (this.getSquare([x+i, y+j]).getType() == "mine")
							count++;
					}
				}
			}
			return count;
		}
		return currentSquare.getSurroundNum();
	}

}


/**
 * Handle the drawing of the graphics on the canvas
 */
class Drawer {
	constructor(x, y) {
		// The pixel location of the top left corner of the initial game tile
		this.anchorX = x;
		this.anchorY = y;
		
		this.flagImage = new Image();
  		this.flagImage.src = 'images/flag.png';
		this.mineImage = new Image();
  		this.mineImage.src = 'images/mine.png';
	}


	/**
	* Draw an individual game tile on the canvas
	* param xy array holding the x, y location of the tile
	* param squareText The text that the game tile holds
	*/
	drawSquare(xy, squareText) {
		// get the pixel location of the game tile
		var x = xy[0] * SQUARE_SIZE + this.anchorX;
		var y = xy[1] * SQUARE_SIZE + this.anchorY;
		
		if(squareText == " " || squareText == "F") // if it's an edge square
			ctx.fillStyle = "#717d69";
		else
			ctx.fillStyle = "#616d59";
		
		ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
		ctx.strokeStyle = "black";
		ctx.strokeRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

		if(squareText == "F")
			ctx.drawImage(this.flagImage, x, y, SQUARE_SIZE, SQUARE_SIZE);
		else if(squareText == "X")
			ctx.drawImage(this.mineImage, x, y, SQUARE_SIZE, SQUARE_SIZE);
		else{
			ctx.fillStyle = this.textColor(squareText);
			ctx.fillText(squareText, x + 0.5*SQUARE_SIZE, y + 0.5*SQUARE_SIZE);
		}
	}

	/**
	* Re-draw the entire game scene
	* param grid
	* param offsetX The X pixel distance the game screen has moved since the last frame
	* param offsetY The Y pixel distance the game screen has moved since the last frame
	*/
	reDraw(grid, offsetX, offsetY) {
		this.anchorX += offsetX;
		this.anchorY += offsetY;

		// clear canvas
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// change size depending on zoom
		ctx.font = 0.6*SQUARE_SIZE + "px Arial";
		ctx.fillStyle = '#081515';
		
		// set background
		ctx.beginPath();
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.stroke();
		

		// Re-draw every individual square
		var keys = grid.getCoords();
		for(var key in keys) {
			this.drawSquare(keys[key], grid.getSquareText(keys[key]));
		}
		
		// Show game over text
		if(gameOverFlag){
			ctx.font = "65px Arial";
			ctx.fillStyle = 'white';
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("Game Over", $(window).width()/2, $(window).height() - 0.50*$(window).height());
		}
		
	}

	/**
	* Get the appropriate text color for a given game tile
	* based on the number of mines surrounding it
	* param	squareText	The text displayed on a game tile representing
	* number of surrounding mines
	* return	color as a string that canvas can understand
	*/
	textColor(squareText){
		switch(squareText){
			case 1:
				return "#0100fc";	// blue
			case 2:
				return "#01c501";	// green
			case 3:
				return "#fd0000";	// red
			case 4:
				return "#010080";	// dark blue
			case 5:
				return "#820002";	// dark red
			case 6:
				return "#008180";	// turquoise
			case 7:
				return "black";
			case 8:
				return "dark gray";
			default:
				return "black";
		}
	}

	getAnchors(){
		return [this.anchorX, this.anchorY];
	}

	setAnchors(x, y){
		this.anchorX = x;
		this.anchorY = y;
	}

}


/*
* Handle the document wide functions
*/

// Handle left click on the screen
// Convert click pixel coordinates to game tile coordinates
function canvasClick(event, grid, drawer){
	var gridOffsetX = Math.floor((event.x - drawer.getAnchors()[0])/SQUARE_SIZE);
	var gridOffsetY = Math.floor((event.y - drawer.getAnchors()[1])/SQUARE_SIZE);
	grid.gridClick(gridOffsetX, gridOffsetY);
}

// Handle right click on the screen
// Convert click pixel coordinates to game tile coordinates
function canvasRightClick(event, grid, drawer){
	event.preventDefault(); // disable default right click
	var gridOffsetX = Math.floor((event.x - drawer.getAnchors()[0])/SQUARE_SIZE);
	var gridOffsetY = Math.floor((event.y - drawer.getAnchors()[1])/SQUARE_SIZE);
	grid.gridRightClick(gridOffsetX, gridOffsetY);
}


// currently unused function to move game screen when cursor is near the edge of the screen
function checkMouse(event){
	var moveX;
	var moveY;	

	if(event.x < 0.1 * $(window).width())
		moveX = 1;
	else if(event.x > 0.9 * $(window).width())
		moveX = -1;
	else moveX = 0;

	if(event.y < 0.1 * $(window).height())
		moveY = 1;
	else if(event.y > 0.9 * $(window).height())
		moveY = -1;
	else moveY = 0;

	return [moveX, moveY];
}

// re-draw the screen
function screenMovement(drawer, grid, moveX, moveY){
	drawer.reDraw(grid, moveX * MOVE_SPEED, moveY * MOVE_SPEED);
}

// Handle zooming in and out where the cursor is 
function scrollWheel(drawer, grid, event){
	var width =  event.x;
	var height =  event.y;
	anchors = drawer.getAnchors();
	x = anchors[0];
	y = anchors[1];
	if(event.deltaY > 0){
		SQUARE_SIZE *= 0.9;
		drawer.setAnchors((x-width)*0.9 + width, (y-height)*0.9 + height);	// zoom away from cursor
	}
	else{
		SQUARE_SIZE /= 0.9;
		drawer.setAnchors((x-width)/0.9 + width, (y-height)/0.9 + height);	// zoom towards cursor
	}
}

// initialize the game screen and graphics
function generateCanvas(){
	$("body").css("overflow", "hidden"); // disable scrolling

	canvas.style.position = 'absolute';
	canvas.style.top = '0px';
	canvas.style.left = '0px';

	var middleMouseFlag = false;
	
	// handle right and left click
	canvas.addEventListener('click', function(event) {canvasClick(event, grid, drawer); screenMovement(drawer, grid, 0, 0);}, false);
	canvas.addEventListener('contextmenu', function(event) {canvasRightClick(event, grid, drawer); screenMovement(drawer, grid, 0, 0);});


	// refresh screen when the mouse is moved and middle mouse button is pressed
	canvas.addEventListener('mousemove', function(event) {
		if(middleMouseFlag){
			screenMovement(drawer, grid, event.movementX, event.movementY);
		}
	}, false);
	
	// Alternative method of screen movement using arrow keys
	document.addEventListener('keydown', function(event) {
		switch(event.code){
			case 'ArrowUp':
				console.log("ok");
				screenMovement(drawer, grid, 0, 50);
				break;
			case 'ArrowDown':
				screenMovement(drawer, grid, 0, -50);
				break;
			case 'ArrowLeft':
				screenMovement(drawer, grid, 50, 0);
				break;
			case 'ArrowRight':
				screenMovement(drawer, grid, -50, 0);
				break;
			
		}
	}, false);

	// track when middle mouse button is pressed
	canvas.addEventListener('mousedown', function(event){if(event.which === 2) middleMouseFlag = true;});
	canvas.addEventListener('mouseup', function(event){if(event.which === 2) middleMouseFlag = false;});
	
	// update screen when the mouse wheen is scrolled
	canvas.addEventListener("wheel", function(event){scrollWheel(drawer, grid, event); screenMovement(drawer, grid, 0, 0);});

	// set up canvas 
	ctx.canvas.width  = $(window).width();
	ctx.canvas.height = $(window).height();
	ctx.font = 0.6*SQUARE_SIZE + "px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillStyle = 'green';
	ctx.beginPath();
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.stroke();
	
	
	
	// Generate Grid
	var x = $(window).width() / 2;
	var y = $(window).height() / 2;
	var drawer = new Drawer(x-SQUARE_SIZE/2, y-SQUARE_SIZE/2);
	var grid = new Grid(drawer);
	
	// initialize screen
	screenMovement(drawer, grid, 0, 0);
	
	
	// Show controls
	ctx.font = "40px Arial";
	ctx.fillStyle = 'white';
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("Middle Mouse Button or Arrow Keys to move", x, $(window).height() - 0.20*$(window).height());
	ctx.fillText("Scroll Wheel to zoom", x, $(window).height() - 0.08*$(window).height());

}	

function main(){
	generateCanvas();
}



main();