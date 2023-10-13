const sortSkins = async (array, query, gamemode) => {
    let result = array;

    if (typeof array === "string") array = JSON.parse(array);
    result = array.filter((skin) => skin.modes.includes(parseInt(gamemode)));

    if (query) {
        const terms = query.toLowerCase().split(" ");
        const regex = /creator:[a-zA-Z0-9]+|publisher:[a-zA-Z0-9]+|hd:(true|false)|sd:(true|false)|animated:(true|false)|extra:(true|false)|color:[a-zA-Z]+|nsfw:(true|false)/;
        for (const term of terms) {
            if (term.match(regex)) {
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
                        ? array.filter((skin) => skin.stats.includes(0))
                        : array.filter((skin) => !skin.stats.includes(0));
                else if (key === "hd")
                    result = value
                        ? array.filter((skin) => skin.stats.includes(1))
                        : array.filter((skin) => !skin.stats.includes(1));
                else if (key === "animated")
                    result = value
                        ? array.filter((skin) => skin.stats.includes(2))
                        : array.filter((skin) => !skin.stats.includes(2));
                else if (key === "extra")
                    result = value
                        ? array.filter((skin) => skin.stats.includes(3))
                        : array.filter((skin) => !skin.stats.includes(3));
                else if (key === "color") continue; // to be handled.
            } else continue; // to be handled.
        }
    }
    return result;
};
