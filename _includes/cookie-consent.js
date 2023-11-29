function loadScriptAsync(scriptSrc, callback)
{
    if (typeof callback !== 'function')
    {
        throw new Error('Not a valid callback for async script load');
    }
    var script = document.createElement('script');
    script.onload = callback;
    script.src = scriptSrc;
    document.head.appendChild(script);
}

{% if site.ga.id %}
loadScriptAsync('https://www.googletagmanager.com/gtag/js?id={{site.ga.id}}', function ()
{
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', '{{site.ga.id}}', { 'anonymize_ip': true });
})
{% endif %}

{% if site.ya.id %}
loadScriptAsync('https://mc.yandex.ru/metrika/tag.js', function ()
{
    // Yandex.Metrika counter
    (function (m, e, t, r, i, k, a)
    {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
        m[i].l = 1 * new Date();
        k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    })
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym({{ site.ya.id }}, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true
});
    // Yandex.Metrika counter
})
{% endif %}

{% if site.comment.livere %}
loadScriptAsync('https://cdn-city.livere.com/js/embed.dist.js', function ()
{
    (function (d, s)
    {
        var j, e = d.getElementsByTagName(s)[0];
        if (typeof LivereTower === 'function') { return; }
        j = d.createElement(s);
        j.src = 'https://cdn-city.livere.com/js/embed.dist.js';
        j.async = true;
        e.parentNode.insertBefore(j, e);
    })(document, 'script');
})
{% elsif site.comment.disqus %}
loadScriptAsync('https://{{ site.comment.disqus }}.disqus.com/embed.js', function ()
{
    var disqus_config = function ()
    {
        this.page.url = "{{ page.url | prepend: site.baseurl | prepend: site.url }}";
        this.page.identifier = "{{ page.url }}";
    };
    var disqus_shortname = '{{ site.comment.disqus }}';

    (function ()
    { // DON'T EDIT BELOW THIS LINE
        var d = document, s = d.createElement('script');
        s.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
})
{% endif %}
