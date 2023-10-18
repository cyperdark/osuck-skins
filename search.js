// declare regexes for keyword detection
const regex = {
	property:
		/creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
	comparison: /(views|downloads|rating)([=<>]+)(\d+)$/,
};

// declare fuction for handling keywords
const sortSkins = async (array, query, gamemode) => {
	// force array to be JSON
	let result = typeof array === "string" ? JSON.parse(array) : array;

	// filter array by gamemode
	result = result.filter((skin) => skin.modes.includes(parseInt(gamemode)));

	if (query) {
		// split query by space character
		const terms = query.toLowerCase().split(" ");

		// interate through terms and handle them individually
		for (const term of terms) {
			// check if term is a property keyword
			if (term.match(regex.property)) {
				// split term into key & value
				let [key, value] = term.split(":"),
					exclude = false;

				// check for exclusion
				if (term.startsWith("-")) {
					key = key.slice(1);

					if (["creator", "publisher", "color"].includes(key)) exclude = true;
					else value = !value;
				}

				//handle value type if keyword is "creator", "publisher";
				if (["creator", "publisher"].includes(key)) {
					!isNaN(value) ? (value = Number(value)) : null;
					typeof value === "string" ? (value = value.toLowerCase()) : null;
				}

				// declare order of "files" array
				const order = ["sd", "hd", "animated", "extra"];

				result = (() => {
					switch (key) {
						case "creator":
							return result.filter((skin) =>
								skin.creators[typeof value === "number" ? "0" : "1"].some(
									(creator) =>
										exclude
											? !creator.toLowerCase().includes(value)
											: creator.toLowerCase().includes(value),
								),
							);
						case "nsfw":
							return value
								? result.filter((skin) => skin._nsfw)
								: result.filter((skin) => !skin._nsfw);
						case "sd":
						case "hd":
						case "animated":
						case "extra":
							return value
								? result.filter((skin) => skin.files.includes(order.indexOf(key)))
								: result.filter((skin) => !skin.files.includes(order.indexOf(key)));
					}
				})();
			} else if (term.match(regex.comparison)) {
				// split term into key, comparison & value
				let [_, key, comparison, value] = term.match(regex.comparison),
					exclude = false;

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
					"<": (a, b) => a < b,
				};

				// handle exclusion
				if (term.startsWith("-")) exclude = true;

				result = result.filter((skin) =>
					exclude
						? !compare[comparison](skin.stats[order.indexOf(key)], value)
						: compare[comparison](skin.stats[order.indexOf(key)], value),
				);
			}
		}
	}

	// return filtered array
	return result;
};
