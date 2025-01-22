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
		prompt: "다음 내용을 한줄로 요약해줘 '" + param.reviews + "'",
		temperature: 0.5
	});
	return json({ data: response.choices });
};
