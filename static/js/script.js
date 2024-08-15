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

				// 각 문장을 p 태그로 감싸서 추가
				sentences.forEach((sentence, index) => {
					const p = document.createElement("p");
					p.textContent = sentence.trim();
					translationResult.appendChild(p);
				});

				// 발음 표기 표시
				const pronunciationList = document.getElementById(
					"pronunciationResult"
				);
				pronunciationList.innerHTML = ""; // 기존 내용 삭제

				// 발음 표기를 문장 단위로 분리 (첫 줄은 설명이므로 제외)
				const pronunciations = data.pronunciation
					.split("\n")
					.slice(1)
					.filter(Boolean);

				// 정규식을 통해 발음 표기를 문장 단위로 더 정확히 분리
				const pronunciationSentences =
					pronunciations.join(" ").match(/[^.!?]+[.!?]+/g) || [];

				if (sentences.length !== pronunciationSentences.length) {
					console.error("문장과 발음 표기의 개수가 일치하지 않습니다.");
				}

				// 각 문장에 대해 발음 표기 및 TTS 재생 버튼 추가
				sentences.forEach((sentence, index) => {
					const li = document.createElement("li");
					const pronunciation = pronunciationSentences[index]
						? pronunciationSentences[index].trim()
						: "(발음 표기 없음)";

					// TTS 응답 처리 (base64 인코딩된 데이터)
					const ttsAudio = data.tts_responses[index] || ""; // 서버에서 Base64로 인코딩된 TTS 응답을 가져옵니다.

					if (ttsAudio) {
						li.innerHTML = `<b>${
							index + 1
						}. ${sentence.trim()}</b><br>${pronunciation}
						<button onclick="playAudio('${ttsAudio}')">🔊</button>`;
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

function playAudio(base64Audio) {
	const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
	audio.play();
}
