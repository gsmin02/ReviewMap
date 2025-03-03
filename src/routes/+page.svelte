<script lang="ts">
	import ReviewList from './ReviewList.svelte';
	import { onMount } from 'svelte';
	import * as googlemaps from '@googlemaps/js-api-loader';
	const { Loader } = googlemaps;
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { maybeCoerceFloat } from 'openai/core.mjs';

	let mapElement: HTMLElement;
	// $state() 로 해당 객체를 반응형으로 변경
	let userList: {
		displayName: string;
		formattedAddress: string;
		authorUri: string;
		authorName: string;
		reviewRating: number;
		reviewText: string;
	}[] = $state([]);
	let loading: boolean = $state(true);

	let summarize: string[] = $state([]);
	let ai_result: string[] = $state([]);

	let draged: boolean = $state(false);

	let map: google.maps.Map | undefined = $state();
	let _InfoWindow: typeof google.maps.InfoWindow;

	let InfoList: google.maps.InfoWindow[] = $state([]);
	let markerList: google.maps.marker.AdvancedMarkerElement[] = $state([]);

	let init_center: any;

	// API 장애 대비 비동기 처리 (Asynchronous)
	// └ 불러오는 시간 동안 다른 작업을 처리하기 위함
	onMount(async function () {
		// API Key를 통한 식별 및 생성자
		const loader = new Loader({
			apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
			version: 'weekly'
		});

		// API Key가 정상적으로 식별된 경우 Map, InfoWindow 클래스를 불러옴
		const { Map, InfoWindow } = await loader.importLibrary('maps');
		_InfoWindow = InfoWindow;

		// 초기 위치 (서울 종로)
		init_center = new google.maps.LatLng(37.571834, 126.977231);

		// Map 클래스의 초기값 설정
		map = new Map(mapElement, {
			// center 값 추후 수정 예정
			// └ 초기값 위치는 테스트용 (서울 종로)
			center: init_center,
			zoom: 11,
			mapId: 'f40c54c8ad07a1c9'
		});

		map.addListener('dragend', () => {
			draged = true;
		});

		// 주변 장소 찾기 기능을 활용하기 위한 함수 정의

		// nearbySearch() 함수 호출 및 정상 반환 시 다음 기능 수행
		// └ 'routes/api' 하위로 추출된 리뷰 정보 전달
		// └ './routes/api' 도 가능? -> Java Servlet에서는 가능한데 잘 모르겠음
		nearbySearch(init_center);
	});

	// 타입스크립트에서 클래스를 파라미터로 활용
	async function nearbySearch(latlng: google.maps.LatLng) {
		//@ts-ignore
		const { Place, SearchNearbyRankPreference } = (await google.maps.importLibrary(
			'places'
		)) as google.maps.PlacesLibrary;
		const { AdvancedMarkerElement } = (await google.maps.importLibrary(
			'marker'
		)) as google.maps.MarkerLibrary;

		const request = {
			// required parameters
			// 가져올 데이터 목록 (이름, 정형 주소, 위치, 리뷰)
			fields: ['displayName', 'formattedAddress', 'location', 'reviews'],
			locationRestriction: {
				center: latlng,
				// 반경
				radius: 500
			},
			// optional parameters
			// 가져올 분류군 : 식당
			includedPrimaryTypes: ['restaurant'],
			// center 기준 최대 장소 정보 : 4
			maxResultCount: 4,
			rankPreference: SearchNearbyRankPreference.POPULARITY,
			language: 'ko-KR',
			region: 'kr'
		};

		//@ts-ignore
		// 설정 값 전달 후 리턴값을 places 저장
		const { places } = await Place.searchNearby(request);

		if (places.length) {
			const { LatLngBounds } = (await google.maps.importLibrary('core')) as google.maps.CoreLibrary;
			const bounds = new LatLngBounds();

			// Loop through and get all the results.
			// 반환된 주변 장소 정보 4개 각각 적용
			places.forEach((place, index) => {
				let infoWindow;
				let contentValue;
				let gen_string: string = '';
				let infoName;
				let infoAddress;
				const markerView = new AdvancedMarkerElement({
					map,
					position: place.location,
					title: place.displayName
				});

				bounds.extend(place.location as google.maps.LatLng);

				// 각 장소 정보에 리뷰 내용(4개) 각각 적용
				// └ LLM AI 리뷰 요약에 활용할 정보 추출
				if (place.reviews && place.reviews.length > 0) {
					place.reviews.forEach((reivew) => {
						// Get info for the first review.
						let reviewRating = reivew.rating;
						let reviewText = reivew.text;
						let authorName = reivew.authorAttribution!.displayName;
						let authorUri = reivew.authorAttribution!.uri;

						// Format the review using HTML.
						// 추출된 정보를 쉽게 확인할 수 있도록 HTML 내용으로 변환
						contentValue = {
							displayName: place.displayName!,
							formattedAddress: place.formattedAddress!,
							authorUri: authorUri!,
							authorName: authorName!,
							reviewRating: reviewRating!,
							reviewText: reviewText!
						};

						userList.push(contentValue);
						// 리뷰 정보 전달 (페이지에 내용 표시)
						gen_string = gen_string + ' ' + reviewText;
					});
					infoName = place.displayName;
					infoAddress = `<div>${place.formattedAddress}</div>`;
				} else {
					contentValue = { blank: 'No reviews were found for ' + place.displayName + '.' };
				}

				infoWindow = new _InfoWindow({
					headerContent: infoName,
					content: infoAddress,
					ariaLabel: place.displayName
				});
				InfoList.push(infoWindow);
				infoWindow.open({
					anchor: markerView,
					map
				});
				markerList.push(markerView);
				// 요약할 정보를 배열로 정리
				summarize[index] = gen_string;
			});
			map?.fitBounds(bounds);
		} else {
			console.log('No results');
		}

		for (let index = 0; index < summarize.length; index++) {
			call_ai(index);
		}
		// summarize[0]과 data[0]은 구글맵에서 추출한 주변 장소 정보 4개 중 1개만 테스트로 진행하기 위한 내용
		// 1개 장소에 4개의 리뷰를 /api 로 전달함 (json)
	}

	async function call_ai(params: number) {
		await fetch('/api', { method: 'POST', body: JSON.stringify({ reviews: summarize[params] }) })
			.then((response) => response.json())
			.then((result) => {
				console.log(result.data[0].message.content);
				ai_result[params] = result.data[0].message.content;
				loading = false; // 추후 위치 변경
			});
	}
</script>

<div class="h-full [&>div>div>div>h3]:text-lg [&>div>div>div>h3]:font-bold">
	<div class="relative mx-auto h-1/2 w-full text-zinc-950">
		<button
			class=" bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-md border border-slate-500 bg-slate-100 p-1 {draged
				? 'absolute'
				: 'hidden'}"
			onclick={() => {
				draged = false;
				console.log(map?.getCenter()?.lat(), map?.getCenter()?.lng());
				userList = [];
				nearbySearch(map?.getCenter()!);
				InfoList.forEach((info) => {
					info.close();
				});
				InfoList = [];
				markerList.forEach((marker) => {
					marker.map = null;
				});
				markerList = [];
			}}
			>현 위치 검색
		</button>
		<div bind:this={mapElement} class="h-full w-full"></div>
	</div>
	<div class="mx-auto flex h-fit w-full flex-wrap p-4">
		{#if !loading}
			{#each ai_result as content, index}
				<div class=" w-full rounded-sm border border-zinc-300 p-4 sm:w-1/2 lg:w-1/4">
					<h2 class=" mb-2 text-xl font-bold">{userList[index * 5].displayName}</h2>
					{@html content}
				</div>
			{/each}
			<br />
			<hr />
			<br />
		{:else}
			<div class="animate-pulse text-center">loading</div>
		{/if}

		<!-- <ReviewList {userList}></ReviewList> -->
	</div>
	<div class="flex items-center justify-center pb-4">© 2025. 이유찬, 구승민 All rights</div>
</div>
