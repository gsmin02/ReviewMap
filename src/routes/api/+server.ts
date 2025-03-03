import { json, type RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

const openai = new OpenAI({
	baseURL: 'http://127.0.0.1:1234/v1/',
	apiKey: 'lm-studio'
});

export const POST: RequestHandler = async (data) => {
	let param = await data.request.json();

	const input =
		"다음은 리뷰 내용. 리뷰를 입력된 순서대로 요약, '맛', '위생', '친절도', '분위기'로 나누어 정리. 리뷰의 본문 내용만 참고. 객관적인 내용 요약. 한글만 작성. 이모티콘 사용 금지. 답변 형식은 MD가 아닌 HTML <div> 태그로 시작. 각 항목은 <h3> 태그만 작성. 지정 태그 이외 모든 태그 추가 적용 금지(<strong> 절대 금지). 마지막 </div>로 마무리.'" +
		param.reviews +
		"'";

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: '당신은 도움이 되는 조수입니다.' },
		{
			role: 'user',
			content: input
		}
	];

	const response = await openai.chat.completions.create({
		model: 'exaone-3.5-7.8b-instruct',
		messages: messages
	});

	// 테스트용
	// const response = { choices: [{ message: { content: '<div><h3>요약</h3></div>' } }] };

	return json({ data: response.choices });
};
