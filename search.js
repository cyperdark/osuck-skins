// declare regexes for keyword detection
const regex = {
	property: /creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
	comparison: /(views|downloads|rating)([=<>]+)(\d+)$/
}

// declare fuction for handling keywords
const sortSkins = async (array, query, gamemode) => {
	let result = array;

	// force array to be JSON
	if (typeof array === "string") array = JSON.parse(array);

	// filter array by gamemode
	result = array.filter((skin) => skin.modes.includes(parseInt(gamemode)));

	if (query) {
		// split query by space character
		const terms = query.toLowerCase().split(" ");

		// interate through terms and handle them individually
		for (const term of terms) {

			// check if term is a property keyword
			if (term.match(regex.property)) {

				// split term into key & value
				let [key, value] = term.split(":"), exclude = false;

				// check for exclusion
				if (term.startsWith("-")) {
					key = key.slice(1);

					if (["creator", "publisher", "color"].includes(key)) exclude = true;
					else value = !value;
				}

				// handle "creator" keyword
				if (key === "creator") 
					result = array.filter((skin) =>
						skin.creators["1"].some((creator) =>
							exclude
								? !creator.toLowerCase().includes(value.toLowerCase())
								: creator.toLowerCase().includes(value.toLowerCase())
						),
					);
				
				// handle "publisher" keyword (WIP)
				else if (key === "publisher") continue;
				
				// handle "nsfw" keyword
				else if (key === "nsfw")
					result = value
						? array.filter((skin) => skin._nsfw)
						: array.filter((skin) => !skin._nsfw);
				
				// handle "sd" keyword
				else if (key === "sd")
					result = value
						? array.filter((skin) => skin.files.includes(0))
						: array.filter((skin) => !skin.files.includes(0));

				// handle "hd" keyword
				else if (key === "hd")
					result = value
						? array.filter((skin) => skin.files.includes(1))
						: array.filter((skin) => !skin.files.includes(1));

				// handle "animated" keyword
				else if (key === "animated")
					result = value
						? array.filter((skin) => skin.files.includes(2))
						: array.filter((skin) => !skin.files.includes(2));
				
				// handle "extra" keyword
				else if (key === "extra")
					result = value
						? array.filter((skin) => skin.files.includes(3))
						: array.filter((skin) => !skin.files.includes(3));

				// handle "color" keyword (WIP)
				else if (key === "color") continue;
			} else if (term.match(regex.comparison)) {

				// split term into key, comparison & value
				let [_, key, comparison, value] = term.match(regex.comparison), exclude = false;

				// force type "number" on value
				value = Number(value);

				// declare order of "stats" array
				const order = ["views", "downloads", "likes", "dislikes", "rating"];

				// declare comparation functions
				const compare = {
					">": (a, b) => a > b,
					">=": (a, b) => a >= b,
					"=": (a, b) => a === b,
					"<=": (a, b) => a <= b,
					"<": (a, b) => a < b
				}

				// handle exclusion
				if (term.startsWith("-")) exclude = true;
				result = array.filter((skin) =>
					exclude
						? !compare[comparison](skin.stats[order.indexOf(key)], value)
						: compare[comparison](skin.stats[order.indexOf(key)], value)
				);
			}
		}
	}
	return result;
};
