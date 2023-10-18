// declare regexes for keyword detection;
const regex = {
	property:
		/id:[0-9]+|creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
	comparison: /(views|downloads|rating)([=<>]+)(\d+)$/,
};

// declare function for handling keywords;
const sortSkins = async (array, query, gamemode) => {
	// force type Object on given array;
	let result = typeof array === "string" ? JSON.parse(array) : array;

	// filter array by gamemode (0 - standard  1 - catch | 2 - mania | 3 - taiko);
	result = result.filter((skin) => skin.modes.includes(parseInt(gamemode)));

	if (query) {
		// split given query by space (" ") character;
		const terms = query.toLowerCase().split(" ");

		// interate through given terms and handle them correspondingly;
		for (const term of terms) {
			// check if terms is a "property" keyword;
			if (term.match(regex.property)) {
				// split the term into 2 values: key & value & define exclude;
				let [key, value] = term.split(":"),
					exclude = false;

				// check if the term is being excluded;
				if (term.startsWith("-")) {
					// remove the excluding symbol ("-") from the key value;
					key = key.slice(1);

					// check if the key is any of the identifiers below. If so, set exclude to true, otherwise invert boolean value;
					if (["creator", "publisher", "color"].includes(key)) exclude = true;
					else value = !value;
				}

				// check if the key is any of the identifiers below;
				// if true, run additional instructions for string manipulation;
				if (["creator", "publisher"].includes(key)) {
					// check if the value is a number. If so, change value type to Number;
					!isNaN(value) ? (value = Number(value)) : null;
					// check if value is a string. If so, lowercase it;
					typeof value === "string" ? (value = value.toLowerCase()) : null;
				}

				// declare the order for the "files" array;
				const order = ["sd", "hd", "animated", "extra"];

				// filter given array based on the key & and save it in "result";
				result = (() => {
					switch (key) {
						case "id": // if key is "id";
							return result.filter((skin) => skin.id == value);
						case "creator": // if key is "creator";
							return result.filter((skin) =>
								skin.creators[typeof value === "number" ? 0 : 1].some((creator) =>
									exclude
										? !creator.toLowerCase().includes(value)
										: creator.toLowerCase().includes(value),
								),
							);
						case "nsfw": // if key is "nsfw";
							return value
								? result.filter((skin) => skin._nsfw)
								: result.filter((skin) => !skin._nsfw);
						case "sd": // if key is "sd";
						case "hd": // or "hd";
						case "animated": // or "animated";
						case "extra": // or "extra";
							return value
								? result.filter((skin) => skin.files.includes(order.indexOf(key)))
								: result.filter((skin) => !skin.files.includes(order.indexOf(key)));
					}
				})();

				// check if term is a "comparison" keyword;
			} else if (term.match(regex.comparison)) {
				// split the term into 3 values: key, comparison & value & define exclude;
				let [_, key, comparison, value] = term.match(regex.comparison),
					exclude = false;

				// force type Number on value;
				value = Number(value);

				// declare the order for the "stats" array;
				const order = ["views", "downloads", "likes", "dislikes", "rating"];

				// declare functions for specific comparisons;
				const compare = {
					">": (a, b) => a > b,
					">=": (a, b) => a >= b,
					"=": (a, b) => a === b,
					"<=": (a, b) => a <= b,
					"<": (a, b) => a < b,
				};

				// check if the term is being excluded;
				if (term.startsWith("-")) exclude = true;

				// filter given array based on the comparison & and save it in "result";
				result = result.filter((skin) =>
					exclude
						? !compare[comparison](skin.stats[order.indexOf(key)], value)
						: compare[comparison](skin.stats[order.indexOf(key)], value),
				);

				// if the term is not a keyword, search for the term in the title or in the keywords/"tags" array;
			} else {
				let exclude = false;

				// check if the term is being excluded;
				if (term.startsWith("-")) exclude = true;

				// filter given array based on the skin name or skin tags & and save it in "result";
				result = result.filter((skin) =>
					exclude
						? !skin.keywords.some((keyword) => keyword.toLowerCase().includes(term))
						: skin.name.toLowerCase().includes(term) ||
						  skin.keywords.some((keyword) => keyword.toLowerCase().includes(term)),
				);
			}
		}
	}

	// return the filtered array;
	return result;
};
