import { json, type RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({
	baseURL: 'http://127.0.0.1:1234/v1',
	apiKey: 'lm-studio'
});

export const POST: RequestHandler = async (data) => {
	let param = await data.request.json();
	const response = await openai.completions.create({
		model: 'deepseek-r1-distill-llama-8b',
		prompt:
			"다음은 리뷰 내용. 리뷰를 요약, '맛', '위생', '친절도', '분위기'로 나누어 정리. 리뷰의 본문 내용만 참고. 객관적인 내용 요약. 한글만 작성.'" +
			param.reviews +
			"'",
		temperature: 0.5
	});
	return json({ data: response.choices });
};
