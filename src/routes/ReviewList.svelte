<script lang="ts">
    let {userList}=$props();
</script>

<div class=" h-full overflow-scroll">
    {#each userList as content, index}
        {#if !content.blank}
            <div id="title"><b>{content.displayName}</b></div>
            <div id="address">{content.formattedAddress}</div>
            <a href="${content.authorUri}" target="_blank">Author: {content.authorName}</a>
            <div id="rating">Rating: {content.reviewRating} stars</div>
            <div id="rating"><p>Review: {content.reviewText}</p></div>
            {:else}
            {content.blank}
        {/if}
    {/each}
</div>

