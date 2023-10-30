
// declare regexes for keyword detection;
const regex = {
	property:
		/id:[0-9]+|creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
	comparison: /(views|downloads|rating)([=<>]+)(\d+)$/,
};

// declare function for sorting skins;
const sortSkins = (array, sort, direction) => {
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
		};
	});
};


// declare function for filtering skins & handling keywords;
// export const sortSkins = () => useWebWorkerFn((array, query, gamemode, sort, order, size, date, ratio) => {
export const filterSkins = () => useWebWorkerFn((array, query, gamemode, sort, order, size, date, ratio) => {
	// force type Object on given array;
	let result = typeof array === "string" ? JSON.parse(array) : array;

	const files_order = ["sd", "hd", "animated", "extra"];
	let exclude = false;


	// filter array by gamemode (0 - standard  1 - catch | 2 - mania | 3 - taiko);
	result = result.filter((skin) => gamemodes.every(mode => skin.modes.includes(mode)));

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
				case 3:
					// if second skin size is at most max.
					return skin.size[1] == size.min;
			};
		});

	// filter given array by views;
	if (views.is_active)
		result = result.filter((skin) => {
			switch (views.type) {
				case 0:
					// if skin views is within min and max limits;
					return skin.stats[0] >= views.min && skin.stats[0] <= views.max;
				case 1:
					// if first skin views is at least min;
					return skin.stats[0] >= views.min;
				case 2:
					// if second skin views is at most max.
					return skin.stats[0] <= views.max;
			};
		});

	// filter given array by downloads;
	if (downloads.is_active)
		result = result.filter((skin) => {
			switch (downloads.type) {
				case 0:
					// if skin downloads is within min and max limits;
					return skin.stats[1] >= downloads.min && skin.stats[1] <= downloads.max;
				case 1:
					// if first skin downloads is at least min;
					return skin.stats[1] >= downloads.min;
				case 2:
					// if second skin downloads is at most max.
					return skin.stats[1] <= downloads.max;
			};
		});

	// filter given array by rating;
	if (ratings.is_active)
		result = result.filter((skin) => {
			switch (ratings.type) {
				case 0:
					// if skin ratings is within min and max limits;
					return skin.stats[4] >= ratings.min && skin.stats[4] <= ratings.max;
				case 1:
					// if first skin ratings is at least min;
					return skin.stats[4] >= ratings.min;
				case 2:
					// if second skin ratings is at most max.
					return skin.stats[4] <= ratings.max;
			};
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
			};
		});
	};

	// filter given array by ratio;
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
				let [key, value] = term.split(":");

				// check if the term is being excluded;
				if (term.startsWith("-")) {
					// remove the excluding symbol ("-") from the key value;
					key = key.slice(1);

					// check if the key is any of the identifiers below. If so, set exclude to true, otherwise invert boolean value;
					if (["creator", "publisher", "color"].includes(key)) exclude = true;
					else value = !value;
				};

				// check if the key is any of the identifiers below;
				// if true, run additional instructions for string manipulation;
				if (["creator", "publisher"].includes(key)) {
					// check if the value is a number. If so, change value type to Number;
					if (!isNaN(value)) value = Number(value);
					// check if value is a string. If so, lowercase it;
					if (typeof value === "string") value = value.toLowerCase();
				};

				// filter given array based on the key & and save it in "result";
				result = result.filter((skin) => {
					switch (key) {
						case "id":
							return skin.id == value;

						case "creator":
							return skin.creators[typeof value === "number" ? 0 : 1].some(
								(creator) => exclude == true
									? !creator.toLowerCase().includes(value)
									: creator.toLowerCase().includes(value),
							);

						case "publisher":
							return exclude == true
								? !skin.publisher.toLowerCase().includes(value)
								: skin.publisher.toLowerCase().includes(value);


						case "nsfw":
							return value ? skin._nsfw : !skin._nsfw;

						// if key is "sd" or "hd" or "animated" or "extra"
						case "sd":
						case "hd":
						case "animated":
						case "extra":
							return value
								? skin.files.includes(files_order.indexOf(key))
								: !skin.files.includes(files_order.indexOf(key));
					};
				});
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
			};
		};
	};

	// sort the filtered array and then return it;
	return sortSkins(result, sort, order);
});
