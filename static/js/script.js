function playAudioAndShowGraph(audioBase64, text, index) {
    console.log("Playing audio...");
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audio.play().catch(e => console.error("Audio playback error:", e));

    // 그래프 표시 로직...
    // 예: showSpeedGraph(text, index);
}

// 필요하다면 그래프 표시 함수도 정의
function showSpeedGraph(text, index) {
    // 그래프 표시 로직...
}

function displayResults(data, originalText, isEnglishToKorean) {
	console.log("Received data:", data);

	// 제목 설정
	document.getElementById("resultTitle").textContent = isEnglishToKorean ? "Translation Result" : "번역 결과";
	document.getElementById("originalTitle").textContent = isEnglishToKorean ? "Original Text:" : "원본 텍스트:";
	document.getElementById("translationTitle").textContent = isEnglishToKorean ? "Translation:" : "번역 결과:";
	document.getElementById("pronunciationTitle").textContent = isEnglishToKorean ? "Pronunciation:" : "발음 표기:";

	// 원본 텍스트 표시
	document.getElementById("original").textContent = originalText;

	// 번역 결과 표시
	const translationResult = document.getElementById("translationResult");
	translationResult.innerHTML = "";
	const p = document.createElement("p");
	p.textContent = isEnglishToKorean ? data.translation : data.translations.join(" ");
	translationResult.appendChild(p);

	// 발음 표기 표시
	const pronunciationList = document.getElementById("pronunciationResult");
	pronunciationList.innerHTML = "";

	const segments = isEnglishToKorean ? data.original_segments : data.translations;
	segments.forEach((segment, index) => {
		const li = document.createElement("li");
		const pronunciation = data.pronunciations[index] || "(발음 표기 없음)";
		const ttsAudio = data.tts_responses[index] || "";

		if (ttsAudio) {
			li.innerHTML = `<b>${index + 1}.</b> ${segment}<br>${pronunciation}
				<button class="play-audio-btn" data-audio="${ttsAudio}" data-segment="${encodeURIComponent(segment)}" data-index="${index}">🔊</button>
				<br><canvas id="SpeedGraph${index}" width="400" height="100"></canvas>`;
			
			// 버튼에 이벤트 리스너 추가
			const button = li.querySelector('.play-audio-btn');
			button.addEventListener('click', function() {
				const audioBase64 = this.getAttribute('data-audio');
				const segment = decodeURIComponent(this.getAttribute('data-segment'));
				const index = this.getAttribute('data-index');
				playAudioAndShowGraph(audioBase64, segment, index);
			});
		} else {
			li.innerHTML = `<b>${index + 1}.</b> ${segment}<br>${pronunciation} (TTS 없음)`;
		}

		pronunciationList.appendChild(li);
	});

	// 결과 섹션 표시
	document.getElementById("result").style.display = "block";
}

// playAudioAndShowGraph 함수는 그대로 유지합니다...

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// 페이지 로드 시 기본 탭 열기
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("koreanToEnglish").style.display = "block";
});

// 기존의 이벤트 리스너들은 그대로 유지...

function startTranslation(button) {
    const buttonText = button.querySelector('.button-text');
    const loadingIndicator = button.querySelector('.loading-indicator');

    buttonText.style.display = 'none';
    loadingIndicator.style.display = 'inline-block';
}

function translationComplete(button) {
    const buttonText = button.querySelector('.button-text');
    const loadingIndicator = button.querySelector('.loading-indicator');

    loadingIndicator.style.display = 'none';
    buttonText.style.display = 'inline';
}

// 다른 함수들...




document
	.getElementById("translationForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();
		const button = this.querySelector('button[type="submit"]');
		startTranslation(button);
		const text = document.getElementById("message").value;

		fetch("http://127.0.0.1:5001/translate_pronunciation", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: text }),
		})
			.then((response) => response.json())
			.then((data) => {
				displayResults(data, text, false); // false는 한국어에서 영어로의 번역을 의미
			})
			.catch((error) => console.error("Error:", error))
			.finally(() => {
				translationComplete(button);
			});
	});

document
	.getElementById("englishTranslationForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();
		const button = this.querySelector('button[type="submit"]');
		startTranslation(button);
		const text = document.getElementById("englishMessage").value;

		fetch("http://127.0.0.1:5001/translate_to_korean", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: text }),
		})
			.then((response) => response.json())
			.then((data) => {
				displayResults(data, text, true); // true는 영어에서 한국어로의 번역을 의미
			})
			.catch((error) => console.error("Error:", error))
			.finally(() => {
				translationComplete(button);
			});
	});