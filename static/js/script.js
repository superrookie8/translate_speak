document
	.getElementById("translationForm")
	.addEventListener("submit", function (event) {
		event.preventDefault(); // 폼의 기본 제출 방식을 막음

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
				// 데이터 확인
				console.log("Received data:", data);

				// 번역 결과를 문장별로 나누어 표시
				const translationResult = document.getElementById("translationResult");
				translationResult.innerHTML = ""; // 기존 내용 삭제

				// 번역된 텍스트를 문장 단위로 분리
				const sentences = data.translation.match(/[^.!?]+[.!?]+/g) || [];

				// 발음 표기 텍스트를 문장 단위로 분리
				const pronunciations = data.pronunciation.match(/[^.!?]+[.!?]+/g) || [];

				// 번역 결과 표시
				sentences.forEach((sentence) => {
					const p = document.createElement("p");
					p.textContent = sentence.trim();
					translationResult.appendChild(p);
				});

				// 발음 표기 표시
				const pronunciationList = document.getElementById(
					"pronunciationResult"
				);
				pronunciationList.innerHTML = ""; // 기존 내용 삭제

				// 각 문장에 대해 발음 표기 및 TTS 재생 버튼 추가
				sentences.forEach((sentence, index) => {
					const li = document.createElement("li");
					const pronunciation = pronunciations[index] || "(발음 표기 없음)";

					// TTS 응답 처리 (base64 인코딩된 데이터)
					const ttsAudio = data.tts_responses[index] || ""; // 서버에서 Base64로 인코딩된 TTS 응답을 가져옵니다.

					if (ttsAudio) {
						li.innerHTML = `<b>${
							index + 1
						}. ${sentence.trim()}</b><br>${pronunciation}
					<button onclick="playAudioAndShowGraph('${ttsAudio}', '${encodeURIComponent(
							sentence
						)}', ${index})">🔊</button>
					<br><canvas id="speedGraph${index}" width="400" height="100"></canvas>`;
					} else {
						li.innerHTML = `<b>${
							index + 1
						}. ${sentence.trim()}</b><br>${pronunciation} (TTS 없음)`;
					}

					pronunciationList.appendChild(li);
				});

				// 결과 섹션 표시
				document.getElementById("result").style.display = "block";
			})
			.catch((error) => console.error("Error:", error));
	});

function playAudioAndShowGraph(base64Audio, encodedSentence, index) {
	const sentence = decodeURIComponent(encodedSentence); // 전달된 sentence를 디코딩합니다.
	const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
	const words = sentence.split(" ").length;

	audio.addEventListener("loadedmetadata", () => {
		const duration = audio.duration; // 재생 길이(초)
		const speed = words / duration; // 속도 계산 (단어/초)

		// x축 최대값을 10초 단위로 설정 (최소 10초)
		const maxDuration = Math.ceil(duration / 10) * 10;

		// 속도를 그래프로 표시
		const ctx = document.getElementById(`speedGraph${index}`).getContext("2d");
		const data = {
			labels: ["Speed"],
			datasets: [
				{
					label: "Words per second",
					data: [speed],
					backgroundColor: "rgba(75, 192, 192, 0.2)",
					borderColor: "rgba(75, 192, 192, 1)",
					borderWidth: 1,
				},
			],
		};

		new Chart(ctx, {
			type: "bar",
			data: data,
			options: {
				indexAxis: "y", // y축을 기준으로 수평 그래프 생성
				scales: {
					x: {
						beginAtZero: true,
						max: maxDuration, // x축 최대값을 10초 단위로 설정
						ticks: {
							stepSize: 10, // 10초 단위로 x축 라벨 표시
						},
						title: {
							display: true,
							text: "Seconds",
						},
					},
				},
			},
		});

		audio.play();
	});
}
