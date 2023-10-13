const sortSkins = async (array, query, gamemode) => {
    let result = array;

    if (typeof array === "string") array = JSON.parse(array);
    result = array.filter((skin) => skin.modes.includes(parseInt(gamemode)));

    if (query) {
		const terms = query.toLowerCase().split(" ");
		for (const term of terms) {
			const regex = {
				property: /creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/,
				comparison: /^(views|downloads|rating)([=<>]+)(\d+)$/

			}

			if (term.match(regex.property)) {
				const [key, value] = term.split(":");
				if (key === "creator")
					result = array.filter((skin) =>
						skin.creators["1"].some((creator) =>
							creator.toLowerCase().includes(value.toLowerCase()),
						),
					);
				else if (key === "publisher") continue; // to be handled.
				else if (key === "nsfw")
					result = value
						? array.filter((skin) => skin._nsfw)
						: array.filter((skin) => !skin._nsfw);
				else if (key === "sd")
					result = value
						? array.filter((skin) => skin.files.includes(0))
						: array.filter((skin) => !skin.files.includes(0));
				else if (key === "hd")
					result = value
						? array.filter((skin) => skin.files.includes(1))
						: array.filter((skin) => !skin.files.includes(1));
				else if (key === "animated")
					result = value
						? array.filter((skin) => skin.files.includes(2))
						: array.filter((skin) => !skin.files.includes(2));
				else if (key === "extra")
					result = value
						? array.filter((skin) => skin.files.includes(3))
						: array.filter((skin) => !skin.files.includes(3));
				else if (key === "color") continue; // to be handled.
			} else if (term.match(regex.comparison)) {
                const [_, key, comparison, value] = term.match(regex.comparison);
				const order = ["views", "downloads", "likes", "dislikes", "rating"];
				const compare = {
					">": (a,b) => a > b,
					">=": (a,b) => a >=b,
					"=": (a,b) => a === b,
					"<=": (a,b) => a <=b,
					"<": (a,b) => a <=b
				}
				result = array.filter(skin => compare[comparison](skin.stats[order.indexOf(key)], value) ); 
			}
		}
	}
	return result;
};
