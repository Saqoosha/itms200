genreData = [
    { name: 'Top 200', id: 1000, genreId: 34 }
    { name: 'J-Pop', id: 1024, genreId: 27 }
    { name: 'Alternative', id: 1015, genreId: 20 }
    { name: 'Anime', id: 27743, genreId: 29 }
    { name: 'Blues', id: 1001, genreId: 2 }
    { name: 'Classical', id: 1002, genreId: 5 }
    { name: 'Dance', id: 1012, genreId: 17 }
    { name: 'Electronic', id: 1004, genreId: 7 }
    { name: 'Fitness & Workout', id: 27800, genreId: 50 }
    { name: 'Hip Hop/Rap', id: 1013, genreId: 18 }
    { name: 'Jazz', id: 1006, genreId: 11 }
    { name: 'Kayokyoku', id: 1025, genreId: 30 }
    { name: 'Pop', id: 1009, genreId: 14 }
    { name: 'R&B/Soul', id: 1010, genreId: 15 }
    { name: 'Reggae', id: 1031, genreId: 24 }
    { name: 'Rock', id: 1017, genreId: 21 }
    { name: 'Soundtrack', id: 1011, genreId: 16 }
    { name: 'Vocal', id: 1016, genreId: 23 }
    { name: 'World', id: 1014, genreId: 19 }
    ]



class Easing

    @expoEaseOut: (t, b = 0, c = 1, d = 1) ->
        if t == 0 then b else c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001


class HSV

    @toRGBA: (h, s, v, a = 1) ->
        f = h / 60
        i = f ^ 0
        m = v - v * s
        k = v * s * (f - i)
        p = v - k
        q = k + m
        r = [v,p,m,m,q,v][i] * 255 ^ 0
        g = [q,v,v,p,m,m][i] * 255 ^ 0
        b = [m,m,q,v,v,p][i] * 255 ^ 0
        "rgba(#{r},#{g},#{b},#{a})"

        
class VolumeSlider
    
    @volume = 0
    
    @init: (el) ->
        v = $.cookie('volume') or 0.8
        VolumeSlider.volume = v
        el.val v * 100
        el.on 'change', ->
            VolumeSlider.volume = el.val() / 100
            $.cookie 'volume', VolumeSlider.volume, path: '/'


class MusicPlayer
    
    FADE_DURATION = 3
    
    @current: null
    
    constructor: (src) ->
        _.extend @, Backbone.Events

        @audio = new Audio
        @audio.volume = 0
        @audio.autoPlay = false
        @audio.loop = false
        @audio.addEventListener 'loadedmetadata', @onLoadedMetaData
        @audio.addEventListener 'ended', @onEnded
        @stopped = false
    
    play: (url) =>
        MusicPlayer.current?.stop()
        @audio.src = url
        MusicPlayer.current = @
        @trigger 'start'
    
    stop: =>
        @stopped = true
        @audio.pause()
        clearInterval @id
        @trigger 'stop'

    onLoadedMetaData: =>
        if @stopped then return;
        @audio.play()
        @id = setInterval @onInterval, 50
    
    onInterval: =>
        v = 1
        current = @audio.currentTime
        if current < FADE_DURATION
            v = Math.max 0, current / FADE_DURATION
        else if @audio.duration - current < FADE_DURATION
            v = Math.max 0, (@audio.duration - current) / FADE_DURATION
        @audio.volume = Easing.expoEaseOut(v * VolumeSlider.volume)
    
    onEnded: =>
        @stop()
        @trigger 'complete'
    

class Track extends Backbone.Model
    
    play: =>
        @player = new MusicPlayer
        @player.bind 'all', (e) => @trigger.apply @, [e, @]
        @player.play @get 'audioUrl'
    
    
class TrackView extends Backbone.View
    
    tagName: 'div'
    className: 'cover'

    template: Haml """
        %img(src=imageUrl)
        .black
            .info
                .title &= itemName
                .artist &= artistName
                %a.itunes(href=storeUrl target="_blank")
                    %img.badge(src="/images/badge_itunes-sm.gif")
        .rank(style=color) = rank
    """
    
    events:
        'mouseenter': 'onMouseEnter'
        'mouseleave': 'onMouseLeave'
    
    initialize: ->
        @model.view = this
        @model.bind 'start', @onStart
        @model.bind 'stop', @onStop
        @el = $(@el)
    
    render: =>
        data = @model.toJSON()
        data.imageUrl ?= '/images/no-cover.png';
        data.storeUrl = "http://itunes.apple.com/jp/album/id#{data.playlistId}?i=#{data.itemId}"
        data.rank = data.order + 1
        data.color = "background-color: #{HSV.toRGBA data.rank, 1, 0.95, 0.7}"
        @el.html @template data
        @image = $ '>img', @el
        @image.hide()
        @image.load @onImageLoaded
        @black = $ '.black', @el
        @black.click @onClick
        @black.hide()
        @rank = $ '.rank', @el
        @rank.hide()
        return this
    
    onImageLoaded: (e) =>
        img = e.target
        w = img.width
        h = img.height
        s = 150 / Math.min(w, h)
        w *= s
        h *= s
        $(img).css
            width: w
            height: h
            left: (150 - w) / 2 + 'px'
            top: (150 - h) / 2 + 'px'
        @image.fadeIn 300
    
    onMouseEnter: (e) =>
        @black.fadeIn 300
        @rank.fadeIn 300
    
    onMouseLeave: (e) =>
        @black.fadeOut 300
        @rank.fadeOut 300 if not @el.hasClass 'playing'
    
    onClick: (e) =>
        @model.play() if e.target.className isnt 'badge'
    
    onStart: =>
        @el.addClass 'playing'
        @rank.fadeIn 300
    
    onStop: =>
        @el.removeClass 'playing'
        @rank.fadeOut 300
    

class Playlist extends Backbone.Collection
    
    model: Track
    

class PlaylistView extends Backbone.View
    
    tagName: 'div'
    className: 'playlist'
    
    initialize: (id, genreId) ->
        @playlist = new Playlist
        @playlist.url = "/playlist/#{id}/#{genreId}"
        @playlist.bind 'add', @addOne
        @playlist.bind 'reset', @addAll
        @playlist.fetch()
    
    addOne: (track, index) =>
        track.set order: index
        track.bind 'complete', @onPlayComplete
        view = new TrackView model: track
        $(@el).append view.render().el
    
    addAll: =>
        @playlist.each @addOne
        
    onPlayComplete: (track) =>
        order = track.get 'order'
        next = @playlist.at order + 1
        next?.play()
        

class GenreMenu
    
    constructor: (el, list) ->
        _.extend @, Backbone.Events

        for data in list
            li = $ "<li><a href='/#{data.id}/#{data.genreId}'>#{data.name}</a></li>"
            a = $ 'a', li
            a.data 'ids', data
            a.click @onClick
            el.append li
    
    onClick: (e) =>
        e.preventDefault()
        ids = $(e.delegateTarget).data 'ids'
        history.pushState ids, ids.name, "/#{ids.id}/#{ids.genreId}"
        @trigger 'select', ids


class App
    
    constructor: ->
        VolumeSlider.init $ '#volume'

        window.addEventListener 'popstate', @onPopState
        window.addEventListener 'resize', @onResize
        @onResize()

        @genreMenu = new GenreMenu $('#genreMenu'), genreData
        @genreMenu.bind 'select', @onGenreSelect
        @changeGenre @find() || genreData[0]
    
    find: ->
        console.log location.pathname
        match = location.pathname.match /^\/(\d+)\/(\d+)$/
        if match?.length is 3
            console.log match
            id = parseInt match[1]
            genreId = parseInt match[2]
            for data in genreData
                return data if data.id is id and data.genreId is genreId
        else if location.pathname is '/'
            return genreData[0]
        return null
    
    changeGenre: (data) =>
        MusicPlayer.current?.stop()
        @current?.remove()
        @current = new PlaylistView data.id, data.genreId
        document.title = "itms200 - #{data.name}"
        $('#genreName').text data.name
        $('#playlist').append @current.el
    
    onGenreSelect: (data) =>
        @changeGenre data
        
    onPopState: (e) =>
        @changeGenre e.state if e.state?
    
    onResize: (e) =>
        w = $('body').width()
        n = ~~((w - 30) / 150)
        m = (w - n * 150) >> 1
        $('#playlist').css
            'width': (150 * n) + 'px'
            'margin-left': m + 'px'
        $('.navbar-inner').css
            'width': (150 * n) + 'px'
            'padding-left': m + 'px'
            'padding-right': m + 'px'
        $('body').css 'background-position': m + 'px 65px'
    
    
$ -> new App















