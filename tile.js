'use strict';

import * as tiles from './tiles.js';
const tileNames = Object.keys(tiles).sort().reverse();
let tileIndex = 0;

const colors = [
	[255,255,255],                           // White
	[255,0,0], [0,255,0], [0,0,255],         // R G B
	[255,255,0], [255,0,255], [0,255,255],   // C M Y
	[0,0,0]                                  // Black
];
let colorIndex = 0;


function addOnLoad( f ){
	var p = window.onload;
	window.onload = ()=>{
		if( p ) p();
		f();
	}
}

function TileToImageData( tile, color ){
	const rows = tile.length;
	const cols = tile[0].length;
	const buffer = new Uint8ClampedArray( rows * cols * 4 ); // R G B A

	for( let y = 0; y < rows; y++ ){
		const line = tile[y];
		for( let x = 0; x < cols; x++ ){
			const idx = ( y * cols + x ) * 4;
			[buffer[idx], buffer[idx + 1], buffer[idx + 2]] =
				line[x] !== ' ' ? (color[0] === 0 && color[1] === 0 && color[2] === 0 ? [255,255,255] : [0,0,0]) : color;
			buffer[idx + 3] = 255;
		}
	}
	return new ImageData( buffer, cols, rows );
}

async function Update( tile, canvas ){
	let ctx = canvas.getContext( '2d' );
	var dpr = window.devicePixelRatio || 1;

	canvas.width  = canvas.getBoundingClientRect().width * dpr;
	canvas.height = canvas.getBoundingClientRect().height * dpr;

	const bitmap = await createImageBitmap( TileToImageData( tiles[tile], colors[colorIndex] ) );
	ctx.fillStyle = ctx.createPattern( bitmap, 'repeat' );
	ctx.fillRect( 0, 0, canvas.offsetWidth * dpr, canvas.offsetHeight * dpr );
}

let touchStart = { X: 0, Y: 0 };

addOnLoad( ()=>{
	const canvas = document.getElementById( 'canvas' );

	var dpr = window.devicePixelRatio || 1;

	Update( tileNames[tileIndex], canvas );
	window.addEventListener( 'resize',      Update( tileNames[tileIndex], canvas ) );

	window.addEventListener( 'wheel',       EventHandler );
	canvas.addEventListener( 'mousedown',   EventHandler );
	window.addEventListener( 'keydown',     EventHandler );

	window.addEventListener( 'touchstart',  EventHandler );
	window.addEventListener( 'touchend',    EventHandler );
	window.addEventListener( 'contextmenu', EventHandler );
})

function Color( x ){
	colorIndex = ( colorIndex + x + colors.length ) % colors.length;
	Redraw();
}
function Pattern( x ){
	tileIndex = ( tileIndex + x + tileNames.length) % tileNames.length;
	Redraw();
}

function Redraw(){
	const canvas = document.getElementById( 'canvas' );
	Update( tileNames[tileIndex], canvas );
}

function ToggleFullscreen(){
	if( document.fullscreenElement ){
		document.exitFullscreen();
	} else {
		document.documentElement.requestFullscreen();
	}
}

function EventHandler( e ){
	switch( e.type ){
		case 'keydown':
			switch( e.key ){
				case 'ArrowLeft':   Color( -1 ); break;
				case 'ArrowRight':  Color( +1 ); break;
				case 'ArrowUp':   Pattern( -1 ); break;
				case 'ArrowDown': Pattern( +1 ); break;
				default: return;
			}
			e.preventDefault();
			break;

		case 'mousedown':
			if( e.button === 0 ){
				ToggleFullscreen();
				break;
			}
			e.preventDefault();
			break;

/*
		case 'mousedown':
			switch( e.button ){
				case 0: Pattern( +1 ); break; // left  mouse button
				case 2: Pattern( -1 ); break; // right mouse button
				default: return;
			}
			e.preventDefault();
			break;
*/
		case 'wheel':
			if( e.shiftKey ){
				Color( Math.sign( e.deltaY ) );
			} else {
				Pattern( Math.sign( e.deltaY ) );
			}
			e.preventDefault();
			break;

		case 'touchstart':
			({ clientX: touchStart.X, clientY: touchStart.Y } = e.touches[0]);
			//e.preventDefault();
			break;

		case 'contextmenu':
			e.preventDefault();
			break;

		case 'touchend':
			const dx = e.changedTouches[0].clientX - touchStart.X;
			const dy = e.changedTouches[0].clientY - touchStart.Y;

			const swipeThresh = 32; // minimum swipe distance
			if(  Math.abs(dx) > swipeThresh || Math.abs(dy) > swipeThresh ){
				if( Math.abs(dx) > Math.abs(dy) ){
					Color( dx > 0 ? + 1 : -1 );
				} else if( Math.abs(dy) > swipeThresh ){
					Pattern( dy < 0 ? +1 : -1 );
				}
				e.preventDefault();
			}
			break;
	}
}
