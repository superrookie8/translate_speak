
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
from io import BytesIO  # 이 줄을 추가하여 BytesIO를 임포트합니다.
from flask import Flask, request, jsonify, render_template, send_file, Response

load_dotenv()


# OpenAI 클라이언트 초기화
client =OpenAI(
    api_key=os.environ.get('OPENAI_API_KEY'),  # 환경 변수에서 API 키 가져오기
)

app = Flask(__name__)

def translate_and_phoneticize(text):
    # GPT-4o-mini 모델을 사용하여 텍스트를 영어로 번역
    translation_response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that translates Korean text to English."},
            {"role": "user", "content": f"Translate the following text to English: {text}"}
        ],
        temperature=0,
        # max_tokens=60
    
    )
    translation = translation_response.choices[0].message.content.strip()

    # GPT-4o-mini 모델을 사용하여 번역된 영어 문장을 발음 표기로 변환
    phonetic_response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that converts English text into phonetic transcription."},
            {"role": "user", "content": f"Write the following English sentence in English phonetic transcription using Hangul: {translation}"}
        ],
        temperature=0,
        # max_tokens=60
    )
    phonetic_text = phonetic_response.choices[0].message.content.strip()

    return translation, phonetic_text

def audio_tts(text):
    speech_response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text

    )    
  

    # 음성 데이터를 메모리에 저장
    audio_io = BytesIO(speech_response.content)

     # 음성 데이터를 Base64로 인코딩
    audio_base64 = base64.b64encode(audio_io.getvalue()).decode('utf-8')

    return audio_base64  # Base64로 인코딩된 음성 데이터를 반환

@app.route('/translate_pronunciation', methods=['POST'])
def translate_pronunciation():
    text = request.json['text']
    translation, phonetic_text = translate_and_phoneticize(text)
    sentences = translation.split('. ')
    tts_responses = [audio_tts(sentence) for sentence in sentences]
   
    return jsonify({'translation': translation, 'pronunciation': phonetic_text, 'tts_responses': tts_responses })

@app.route('/')
def index():
    # return "Translation API is running!"
    return render_template('index.html')


@app.route('/result_demo')
def result_demo():
    dummy_data = {
        'translation': 'This is a sample translated text. It can be quite long to test the layout.',
        'pronunciation': [
            '디스 이즈 어 샘플 트랜슬레이티드 텍스트.',
            '잇 캔 비 콰이트 롱 투 테스트 더 레이아웃.'
        ]
    }
    return render_template('result.html', data=dummy_data)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
