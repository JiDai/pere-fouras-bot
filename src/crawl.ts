import {DOMParser} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import {assert} from "https://deno.land/std@0.157.0/testing/asserts.ts";

async function main() {
	const parser = new DOMParser();
	const json = [];

	for (const arrayKey of Array.from(Array(1).keys())) {
		const year = 2007 + arrayKey;
		const response = await fetch(`https://www.fan-fortboyard.fr/pages/fanzone/enigmes-du-pere-fouras/${year}.html`);
		const html = await response.text();
		const document = parser.parseFromString(html, "text/html",);

		assert(document);
		const showTitles = document.querySelectorAll("h2");
		for (const showTitle of showTitles) {
			const textContent = showTitle.childNodes[0].nodeValue.trim();

			if (textContent.includes(`Fort Boyard ${year}`)) {
				const riddles = showTitle.nextSibling.parentElement.querySelectorAll('p');

				for (const riddle of riddles) {
					json.push({
						id: crypto.randomUUID(),
						question: Array.from(riddle.childNodes)
							.slice(2, -3)
							.map(node => node.textContent.trim())
							.filter(Boolean),
						answer: riddle.childNodes[riddle.childNodes.length - 2].textContent,
						show: showTitle.textContent.trim()
					});
				}
			}
		}
	}

	await Deno.writeTextFile('./data/riddles.json', JSON.stringify(json));
}

main();
