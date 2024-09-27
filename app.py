from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
from io import BytesIO  # 이 줄을 추가하여 BytesIO를 임포트합니다.
from flask import Flask, request, jsonify, render_template

load_dotenv()


# OpenAI 클라이언트 초기화
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  # 환경 변수에서 API 키 가져오기
)

app = Flask(__name__)

import re


def translate_and_phoneticize(text):
    # GPT-4o-mini 모델을 사용하여 텍스트를 영어로 번역
    translation_response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that translates Korean text to English. For short sentences, provide alternative expressions separated by '|||'. For long sentences, provide only one translation.",
            },
            {
                "role": "user",
                "content": f"Translate the following text to English: {text}",
            },
        ],
        temperature=0,
    )
    translation = translation_response.choices[0].message.content.strip()

    # 번역 문장과 절로 분리 (마침표, 느낌표, 물음표, 쉼표 기준)
    segments = re.split(r"(?<=[.!?,])\s+", translation)

    # 각 세그먼트에 대한 발음 표기 생성
    phonetic_texts = []
    for segment in segments:
        phonetic_response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 영어 발음을 한글로 정확하게 표기하는 전문가입니다.",
                },
                {
                    "role": "user",
                    "content": f"다음 영어 문장을 한국어 문자(한글)로 음사해 주세요. 영어 원어민의 자연스러운 발음을 최대한 반영하여 표기해 주세요. 오직 한글 음사만 작은따옴표 안에 제공해 주세요: '{segment}'",
                },
            ],
            temperature=0.3,
        )
        phonetic_texts.append(phonetic_response.choices[0].message.content.strip())

    return segments, phonetic_texts


def audio_tts(text):
    speech_response = client.audio.speech.create(
        model="tts-1", voice="alloy", input=text
    )
    # 음성 데이터를 메모리에 저장
    audio_io = BytesIO(speech_response.content)

    # 음성 데이터를 Base64로 인코딩
    audio_base64 = base64.b64encode(audio_io.getvalue()).decode("utf-8")

    return audio_base64  # Base64로 인코딩된 음성 데이터를 반환


@app.route("/translate_pronunciation", methods=["POST"])
def translate_pronunciation():
    text = request.json["text"]
    segments, phonetic_texts = translate_and_phoneticize(text)

    # TTS 응답 생성 (영어 원문에 대해)
    tts_responses = []
    for segment in segments:
        try:
            tts_response = audio_tts(segment)
            tts_responses.append(tts_response)
        except Exception as e:
            print(f"TTS 생성 중 오류 발생: {str(e)}")
            tts_responses.append("")

    return jsonify(
        {
            "translations": segments,
            "pronunciations": phonetic_texts,
            "tts_responses": tts_responses,
        }
    )


@app.route("/")
def index():
    # return "Translation API is running!"
    return render_template("index.html")


@app.route("/result_demo")
def result_demo():
    dummy_data = {
        "translation": "This is a sample translated text. It can be quite long to test the layout.",
        "pronunciation": [
            "디스 이즈 어 샘플 트랜슬레이티드 텍스트.",
            "잇 캔 비 콰이트 롱 투 테스트 더 레이아웃.",
        ],
    }
    return render_template("result.html", data=dummy_data)


def translate_to_korean_and_phoneticize(text):
    # GPT-4 모델을 사용하여 텍스트를 한국어로 번역
    translation_response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that translates English text to Korean.",
            },
            {
                "role": "user",
                "content": f"Translate the following text to Korean: {text}",
            },
        ],
        temperature=0,
    )
    translation = translation_response.choices[0].message.content.strip()

    # 영어 원문을 문장과 절로 분리 (마침표, 느낌표, 물음표, 쉼표 기준)
    segments = re.split(r"(?<=[.!?,])\s+", text)

    # 각 영어 세그먼트에 대한 한국어 발음 표기 생성
    phonetic_texts = []
    for segment in segments:
        max_retries = 3
        for _ in range(max_retries):
            try:
                phonetic_response = client.chat.completions.create(
                    model="gpt-4o-mini-2024-07-18",
                    messages=[
                        {
                            "role": "system",
                            "content": "당신은 영어 발음을 한글로 정확하게 표기하는 전문가입니다.",
                        },
                        {
                            "role": "user",
                            "content": f"다음 영어 문장을 한국어 문자(한글)로 음사해 주세요. 영어 원어민의 자연스러운 발음을 최대한 반영하여 표기해 주세요. 오직 한글 음사만 작은따옴표 안에 제공해 주세요: '{segment}'",
                        },
                    ],
                    temperature=0.3,
                )
                phonetic_text = phonetic_response.choices[0].message.content.strip()

                # 정규 표현식을 사용하여 원하는 형식만 추출
                match = re.search(r"'([^']+)'", phonetic_text)
                if match:
                    phonetic_text = match.group(1)
                else:
                    raise ValueError("Invalid response format")

                phonetic_texts.append(phonetic_text)
                break
            except Exception as e:
                print(f"Error in phonetic transcription: {e}. Retrying...")
        else:
            print(f"Failed to get valid phonetic transcription for: {segment}")
            phonetic_texts.append("(발음 변환 실패)")

    return translation, segments, phonetic_texts


# 새로운 API 엔드포인트 추가
@app.route("/translate_to_korean", methods=["POST"])
def translate_to_korean():
    text = request.json["text"]
    translation, segments, phonetic_texts = translate_to_korean_and_phoneticize(text)

    # TTS 응답 생성 (영어 원문에 대해)
    tts_responses = []
    for segment in segments:
        try:
            tts_response = audio_tts(segment)
            tts_responses.append(tts_response)
        except Exception as e:
            print(f"TTS 생성 중 오류 발생: {str(e)}")
            tts_responses.append("")

    return jsonify(
        {
            "translation": translation,
            "original_segments": segments,
            "pronunciations": phonetic_texts,
            "tts_responses": tts_responses,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
