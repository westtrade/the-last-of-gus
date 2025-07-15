import { Howl } from "howler";

import backgroundMusicSrc from "@shared/assets/sounds/background.mp3";
import tapSoundSrc from "@shared/assets/sounds/tap.mp3";

export const backgroundMusic = new Howl({
	src: [backgroundMusicSrc],
	autoplay: false,
	loop: true,
	volume: 0,
});

export const tapSound = new Howl({
	src: [tapSoundSrc],
	sprite: {
		click: [2500, 200],
	},
	volume: 0.3,
});
