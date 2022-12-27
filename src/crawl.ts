import {DOMParser} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

type Riddle = {
	id: string,
	question: Array<string>,
	show: string,
	answer: string
}

async function main() {
	const parser = new DOMParser();
	const json: Array<Riddle> = [];

	let currentQuestionIndex = -1;
	let collectingLines = false;

	for (const arrayKey of Array.from(Array(14).keys())) {
		const year = 2007 + arrayKey;
		const url = `https://www.fan-fortboyard.fr/pages/fanzone/enigmes-du-pere-fouras/${year}.html`;
		console.log(`Parsing ${url}...`);
		const response = await fetch(url);
		const html = await response.text();
		const document = parser.parseFromString(html, "text/html",);

		const showTitles = document.querySelectorAll("h2");
		for (const showTitle of showTitles) {
			const textContent = showTitle.childNodes[0].nodeValue.trim();

			if (textContent.includes(`Fort Boyard ${year}`)) {
				console.log(`Find ${textContent.trim()}...`);
				const riddles = showTitle.nextSibling.parentElement.querySelectorAll('p');

				for (const riddle of riddles) {
					if (riddle.textContent === 'Aucune énigme') {
						continue;
					}

					const nodes = Array.from(riddle.childNodes)
						.map(node => node.textContent.trim())
						.filter(Boolean);

					nodes.forEach(function (node, index) {
						if (/^[0-9]+/.test(node)) { // Title
							json.push(
								{
									id: crypto.randomUUID(),
									question: [],
									show: showTitle.textContent.trim(),
									answer: ''
								}
							);
							currentQuestionIndex ++;
							collectingLines = true;
						} else if (collectingLines && node.startsWith('RÉPONSE')) {
							json[currentQuestionIndex].answer =
								nodes[index + 1].replace(/(La|Le|L'|Les)\s+/, '');
							collectingLines = false;
						} else if (collectingLines) {
							json[currentQuestionIndex].question.push(node);
						}
					});
				}
			}
		}
	}

	await Deno.writeTextFile('./data/riddles.json', JSON.stringify(json));
}

main();
