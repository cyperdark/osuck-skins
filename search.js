// declare regexes for keyword detection;
const regex = {
	property:
		/id:[0-9]+|creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
	comparison: /(views|downloads|rating)([=<>]+)(\d+)$/,
};

// declare function for sorting skins;
const sortSkins = async (array, sort, direction) => {
	// sort array based on the given sort option;
	return array.sort((a, b) => {
		switch (sort) {
			case 0:
				// sort by skin download count;
				return direction ? a.stats[1] - b.stats[1] : b.stats[1] - a.stats[1];
			case 1:
				// sort by skin view count;
				return direction ? a.stats[0] - b.stats[0] : b.stats[0] - a.stats[0];
			case 2:
				// sort by skin rating;
				return direction ? a.stats[4] - b.stats[4] : b.stats[4] - a.stats[4];
			case 3:
				// sort by skin size;
				return direction ? a.size[0] - b.size[0] : b.size[0] - a.size[0];
			case 4:
				// sort by skin upload date;
				return direction
					? new Date(a.updated_at) - new Date(b.updated_at)
					: new Date(b.updated_at) - new Date(a.updated_at);
			case 5:
				// sort by skin name;
				return direction
					? `${b.name} v${b.version.text}` > `${a.name} v${a.version.text}`
						? 1
						: -1
					: `${a.name} v${a.version.text}` > `${b.name} v${b.version.text}`
					? 1
					: -1;
			default:
				return a - b;
		}
	});
};

// declare function for filtering skins & handling keywords;
const filterSkins = async (array, query, gamemode, size, date, ratio) => {
	// force type Object on given array;
	let result = typeof array === "string" ? JSON.parse(array) : array;

	// filter array by gamemode (0 - standard  1 - catch | 2 - mania | 3 - taiko);
	result = result.filter((skin) => skin.modes.includes(Number(gamemode)));

	// filter given array by size;
	if (size.is_active)
		result = result.filter((skin) => {
			switch (size.type) {
				case 0:
					// if skin size is within min and max limits;
					return skin.size[0] >= size.min && skin.size[1] <= size.max;
				case 1:
					// if first skin size is at least min;
					return skin.size[0] >= size.min;
				case 2:
					// if second skin size is at most max.
					return skin.size[1] <= size.max;
			}
		});

	// filter given array by date;
	if (date.is_active) {
		// define min and max from user settings;
		const min = new Date(date.min).getTime();
		const max = new Date(date.max).getTime();

		result = result.filter((skin) => {
			// define time as the skin's upload date;
			const time = new Date(skin.created_at).getTime();

			switch (date.type) {
				case 0:
					// if both min & max values were changed;
					return time > min && time < max;
				case 1:
					// if just min value was changed;
					return time > min;
				case 2:
					// if just max value was changed;
					return time < max;
				default:
					return false;
			}
		});
	}

	// filter given array by date;
	if (ratio.is_active)
		result = result.filter((skin) => skin.ratios.includes(Number(ratio.selected)));

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

				// filter given array based on the key & and save it in "result";
				result = result.filter((skin) => {
					switch (key) {
						case "id":
							// if key is "id";
							return skin.id == value;
						case "creator":
							// if key is "creator";
							return skin.creators[typeof value === "number" ? 0 : 1].some(
								(creator) =>
									exclude
										? !creator.toLowerCase().includes(value)
										: creator.toLowerCase().includes(value),
							);
						case "nsfw":
							// if key is "nsfw";
							return value ? skin._nsfw : !skin._nsfw;
						case "sd":
						// if key is "sd";
						case "hd":
						// or "hd";
						case "animated":
						// or "animated";
						case "extra":
							// or "extra";
							const order = ["sd", "hd", "animated", "extra"];
							return value
								? skin.files.includes(order.indexOf(key))
								: !skin.files.includes(order.indexOf(key));
					}
				});

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

				let queryy = "views>40";
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
				console.log(exclude);

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

	// sort the filtered array and then return it;
	return await sortSkins(result, sort, order);
};
