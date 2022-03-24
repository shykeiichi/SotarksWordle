<script>
	function randomArrayShuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
	}

	import names from "./names"

	let words = randomArrayShuffle(names);

	let startDate = "2022-01-01";
	let date1 = new Date();
	let date2 = new Date(startDate);
	let timeInMilisec = date1.getTime() - date2.getTime();
	let daysBetweenDates = Math.ceil(timeInMilisec / (1000 * 60 * 60 * 24));

	let nameToday = words[daysBetweenDates - 1];
	let name = "";
	
	console.log(nameToday);

	let difficulty = 0;

	let stop = false;

	let guessedNames = [];

	let saveData = JSON.parse(localStorage.getItem('stats')) != undefined ? 
		JSON.parse(localStorage.getItem('stats')) : 
		{
			"lastPlayed": "",
			"lastGuesses": [],
			"currentStreak": 0,
			"maxStreak": 0,
			"guesses": {
				"1":0,
				"2":0,
				"3":0,
				"4":0,
				"5":0,
				"6":0,
				"7":0,
				"8":0,
				"fail":0
			},
			"winPercentage": 0,
			"gamesPlayed": 0,
			"gamesWon": 0
		};

	localStorage.setItem("stats", JSON.stringify(saveData));

	// if(saveData["lastPlayed"] == new Date().toDateString()) {
	// 	guessedNames = saveData["lastGuesses"];
	// 	stop = true;
	// }

	function isWhatPercentOf(numA, numB) {
		let num = (numA / numB) * 100;
		return num
	}

	function submitName() {
		if(name != "" && name.length < 23) {
			guessedNames.push(name);
			guessedNames = guessedNames;

			if(name.toLowerCase() == nameToday.toLowerCase()) {
				stop = true;
				saveData["lastPlayed"] = new Date().toDateString();
				saveData["lastGuesses"] = guessedNames;
				saveData["currentStreak"] += 1;
				if(saveData["currentStreak"] > saveData["maxStreak"]) {
					saveData["maxStreak"] = saveData["currentStreak"];
				}
				saveData["guesses"][guessedNames.length.toString()] += 1;
				saveData["gamesPlayed"] += 1;
				saveData["gamesWon"] += 1;
				saveData["winPercentage"] = isWhatPercentOf(saveData["gamesWon"], saveData["gamesPlayed"]);
				localStorage.setItem('stats', JSON.stringify(saveData));
			} else if(guessedNames.length == 8) {
				stop = true;
				saveData["lastPlayed"] = new Date().toDateString();
				saveData["lastGuesses"] = guessedNames;
				saveData["currentStreak"] = 0;
				saveData["maxStreak"] = 0;
				saveData["guesses"]["fail"] += 1;
				saveData["gamesPlayed"] += 1;
				saveData["winPercentage"] = isWhatPercentOf(saveData["gamesWon"], saveData["gamesPlayed"]);
				localStorage.setItem('stats', JSON.stringify(saveData));
			}

			name = "";
		}
	}

	const submitNameInputKeyPress = e => {
		if(name.length > 22) {
			name = name.substring(0, 22);
		}

		if (e.charCode === 13) {
			submitName();
		}
	};

	function calculateLetter(index, letter, word) {
		// if(index < nameToday.length) {
		// 	if(nameToday[index].toLowerCase() == letter.toLowerCase()) {
		// 		return 2;
		// 	}
		// }

		// let amountOf = nameToday.toLowerCase().split(letter.toLowerCase()).length - 1;
		// let letterPosition = 0;

		// for(var i = 0; i < word.length; i++) {
		// 	if(word[i].toLowerCase() == letter.toLowerCase()) {
		// 		letterPosition ++;
		// 	}
		// }

		// // console.log(letterPosition);

		// if(letterPosition > amountOf) {
		// 	return 0;
		// } else {
		// 	return 1;
		// }

		if(nameToday[index] == letter) {
			return 2;
		} else if(word.includes(letter)) {
			return 1;
		} else {
			return 0;
		}
	}
</script>

<container>
	<div class="helpContainer">
		<div class="helpTitle">
			How to play
		</div>
		<div class="helpName">
			You are searching for a Sotarks Map from after Jan 2018 <br />
			Only the base name so no (TV Size) or (Cut ver.)
		</div>

		<div>
			<div class="helpName resultBar">
				{#each "Harumachi Clover".split("") as letter, i}
					{#if i == 0}
						<div class="resultBarLetter" style="background-color: #d4ff8a;">
							{letter}
						</div>
					{:else}
						<div class="resultBarLetter">
							{letter}
						</div>
					{/if}
				{/each}
			</div>
		</div>
		<div>
			The letter <b>H</b> is in the right place.
		</div>

		<div class="helpSpacer"/>

		<div>
			<div class="helpName resultBar">
				{#each "Harumachi Clover".split("") as letter, i}
					{#if i == 1}
						<div class="resultBarLetter" style="background-color: #fffd8c;">
							{letter}
						</div>
					{:else}
						<div class="resultBarLetter">
							{letter}
						</div>
					{/if}
				{/each}
			</div>
		</div>
		<div>
			The letter <b>a</b> is in the name but in the wrong place.
		</div>

		<div class="helpSpacer"/>

		<div>
			<div class="helpName resultBar">
				{#each "Harumachi Clover".split("") as letter, i}
					<div class="resultBarLetter">
						{letter}
					</div>
				{/each}
			</div>
		</div>
		<div>
			If the letter doesn't have a color then it doesn't exist in the name.
		</div>

		<div style="margin-top: 30px"/>

		<div class="helpLength" style="background-color: #d4ff8a;" />
		<div class="helpName">
			If the box to the right is &nbsp; <div style="background-color: #d4ff8a;">green</div> &nbsp; then the name is the right length.
		</div>

		<div class="helpSpacer"/>

		<div class="helpLength" style="background-color: #fffd8c; float: left;" />
		<div class="helpName">
			If the box to the right is &nbsp; <div style="background-color: #fffd8c;">yellow</div> &nbsp; then the length of the name is +- 2.
		</div>

		<div class="helpSpacer"/>

		<div class="helpLength"/>
		<div>
			If the box to the right is gray then the length of name has a bigger difference than 2.
		</div>
	</div>

	<main>
		<!-- <div class="difficultyPicker">
			<div class="difficultyItem" style="background-color: #d4ff8a;">
				<div class="difficultyItemTitle">
					Enkelt
				</div>
				<div class="difficultyItemDescription">
					(Bara förnamn 'John')
				</div>
			</div>
			<div class="difficultyItem" style="background-color: #fffd8c;">
				<div class="difficultyItemTitle">
					Medelsvårt
				</div>
				<div class="difficultyItemDescription">
					(Förkortade namn 'Johdoe')
				</div>
			</div>
			<div class="difficultyItem" style="background-color: #ff968c;">
				<div class="difficultyItemTitle">
					Svårt
				</div>
				<div class="difficultyItemDescription">
					(Hela namn 'John Doe')
				</div>
			</div>
		</div> -->
		<div class="resultContainer">
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as row}
				<div class="resultBar">
					{#if guessedNames.length > row}
						{#each guessedNames[row] as letter, i}
							{#if calculateLetter(i, letter, guessedNames[row]) == 2}
								<div class="resultBarLetter" style="background-color: #d4ff8a;">
									{letter}
								</div>
							{:else if calculateLetter(i, letter, guessedNames[row]) == 1}
								<div class="resultBarLetter" style="background-color: #fffd8c;">
									{letter}
								</div>
							{:else if calculateLetter(i, letter, guessedNames[row]) == 0}
								<div class="resultBarLetter">
									{letter}
								</div>
							{/if}
						{/each}
					{:else if guessedNames.length == row}
						{#each name as letter, i}
							<div class="resultBarLetter">
								{letter}
							</div>
						{/each}
					{/if}
					{#if guessedNames[row] != undefined}
						{#if guessedNames[row].length == nameToday.length}
							<div class="resultBarLength" style="background-color: #d4ff8a;" />
						{:else if Math.abs(guessedNames[row].length - nameToday.length) < 3}
							<div class="resultBarLength" style="background-color: #fffd8c;"/>
						{:else}
							<div class="resultBarLength" />
						{/if}
					{/if}
				</div>
			{/each}

			{#if !stop}
				<span> 
					Namn: <input bind:value={name} on:keypress={submitNameInputKeyPress}/> <button on:click={() => submitName()}>Välj</button>
				</span>
			{:else}
				<div class="statistics">
					<div class="statisticsTitle">
						Statistik
					</div>
					<div class="statisticsContainerHolder">
						<div class="statisticsContainer">
							<div class="statistic">
								{saveData["gamesPlayed"]}
							</div>
							<div class="label">
								Played Rounds
							</div>
						</div>
						<div class="statisticsContainer">
							<div class="statistic">
								{saveData["winPercentage"]}
							</div>
							<div class="label">
								Win %
							</div>
						</div>
						<div class="statisticsContainer">
							<div class="statistic">
								{saveData["currentStreak"]}
							</div>
							<div class="label">
								Current Streak
							</div>
						</div>
						<div class="statisticsContainer">
							<div class="statistic">
								{saveData["maxStreak"]}
							</div>
							<div class="label">
								Highest Streak
							</div>
						</div>
					</div>

					<div class="statisticsTitle">
						Guesses
					</div>
					<div class="guessesContainer">
						{#each Object.keys(saveData["guesses"]) as guess, i}
							<span>
								{guess.charAt(0).toUpperCase() + guess.slice(1)} <progress value={saveData["guesses"][guess].toString()} max={saveData["gamesPlayed"].toString()} style="width: 300px"/>
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</main>

	<footer>
		&#169; Made by <a href="https://twitter.com/oncelastapril">oncelastapril</a>
	</footer>
</container>

<style>

	container {
		display: flex;
		flex-direction: row;
		margin-top: 3em;
		justify-content: center;
	}

	@media only screen and (max-width: 1100px){
		container {
			flex-direction: column-reverse;
			place-content: center;
			width: 100%;
			gap: 100px;
		}

		.helpContainer {
			place-items: center;
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		main {
			place-items: center;
			width: 100%;
			margin-left: auto;
			margin-right: auto;
		}
	}
	@media only screen and (min-width: 1100px) {
		.helpContainer {
			width: 540px;
			margin-left: 60px;              /* new */
			margin-right: 60px;
			margin-left: 3em;
			flex: auto 0 1;
		}
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: max-content;
		margin-right: auto;
		margin-left: 8%;
	}

	.difficultyPicker {
		display: flex;
		flex-direction: row;
		height: 50px;
		width: 100%;
		gap: 10px;
	}

	.difficultyItem {
		display: flex;
		flex-direction: column;
		width: 100%;
		/* line-height: 50px; */
		text-align: center;
		vertical-align: middle;
		border-radius: 5px;
	}

	.difficultyItemTitle {
		font-size: 20px;
	}

	.difficultyItemDescription {
		font-size: 13px;
	}

	.resultContainer {
		display: flex;
		place-items: center;
		flex-direction: column;
		gap: 10px;
		/* margin-left: auto; */
		margin-right: auto;
	}

	.resultBar {
		width: 470px;
		height: 50px;
		background-color: #e9e9e9;
		border-radius: 5px;
		display: flex;
		align-items: center;
		padding-right: 20px;
		padding-left: 20px;
		font-size: 20px;
		gap: 2px;
	}

	.resultBarLetter {
		display: grid;
		place-items: center;
		width: 18px;
		height: calc(max-content + 2px);
		border-radius: 5px;
	}

	.resultBarLength {
		width: 40px;
		height: 40px;
		background-color: #cacaca;
		border-radius: 5px;
		flex: 0 1 auto;
		margin-left: auto;              /* new */
		margin-right: -15px;
	}

	.helpContainer {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 20px;
		align-items: center;
		text-align: center;
		width: 700px;
	}

	.helpTitle {
		font-size: 30px;
		font-weight: bold;
	}

	.helpSpacer {
		width: 90%;
		height: 2px;
		background-color: #cacaca;
		margin-top: 10px;
	}

	.helpName {
		display: flex;
		flex-direction: row;
	}

	.helpLength {
		width: 40px;
		height: 40px;
		background-color: #cacaca;
		border-radius: 5px;
	}

	.statistics {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px 0;
		width: 100%;
		gap: 20px;
	}

	.statisticsTitle {
		font-weight: 700;
		font-size: 16px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		text-align: center;
		margin-bottom: 10px;
	}

	.statisticsContainerHolder {
		display: flex;
		flex: row;
	}

	.statisticsContainer {
		flex: 1;
	}

	.statisticsContainer .statistic {
		font-size: 36px;
		font-weight: 400;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		letter-spacing: 0.05em;
		font-variant-numeric: proportional-nums;
	}

	.statisticsContainer .label {
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.guessesContainer {
		display: flex;
		flex-direction: column;
		margin-bottom: 30px;
	}

	footer {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 25px;
		background-color: #e6e6e6;
		text-align: center;
	}
</style>