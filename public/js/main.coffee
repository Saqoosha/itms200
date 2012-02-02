$ ->

    class Easing
        @expoEaseOut: (t, b = 0, c = 1, d = 1) ->
            if t == 0 then b else c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001
            
            
    class VolumeSlider
        
        @volume = 0
        
        @init: (el) ->
            v = $.cookie('volume') or 0.8
            VolumeSlider.volume = v
            el.val v * 100
            el.on 'change', ->
                VolumeSlider.volume = el.val() / 100
                $.cookie 'volume', VolumeSlider.volume


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
                .rank = rank
        """
        
        events:
            'mouseenter': 'onMouseEnter'
            'mouseleave': 'onMouseLeave'
            # 'click': 'onClick'
        
        initialize: ->
            @model.view = this
            @model.bind 'start', @onStart
            @model.bind 'stop', @onStop
            @el = $(@el)
        
        render: =>
            data = @model.toJSON()
            data.storeUrl = "http://itunes.apple.com/jp/album/id#{data.playlistId}?i=#{data.itemId}"
            data.rank = data.order + 1
            @el.html @template data
            @image = $('>img', @el)
            @image.load @onImageLoaded
            @black = $('.black', @el)
            @black.click @onClick
            @black.hide()
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
        
        onMouseEnter: (e) =>
            @black.fadeIn(300)
        
        onMouseLeave: (e) =>
            @black.fadeOut(300)
        
        onClick: (e) =>
            @model.play() if e.target.className isnt 'badge'
        
        onStart: =>
            $(@el).addClass 'playing'
        
        onStop: =>
            $(@el).removeClass 'playing'
        
    
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
            console.log @playlist.length
            
        onPlayComplete: (track) =>
            order = track.get 'order'
            next = @playlist.at order + 1
            next?.play()
            

    VolumeSlider.init($('#volume'))
    p = new PlaylistView 1000, 34
    $('body').append p.el
