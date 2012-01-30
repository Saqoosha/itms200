$ ->

    class Easing
        @expoEaseOut: (t, b = 0, c = 1, d = 1) ->
            if t == 0 then b else c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001


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
                v = Easing.expoEaseOut v
            else if @audio.duration - current < FADE_DURATION
                v = Math.max 0, (@audio.duration - current) / FADE_DURATION
                v = Easing.expoEaseOut v
            @audio.volume = v
        
        onEnded: =>
            @stop()
            @trigger 'complete'
        
    
    class Track extends Backbone.Model
        
        play: =>
            @player = new MusicPlayer
            @player.bind 'all', (e) => @trigger.apply @, [e, @]
            @player.play @get 'audio-preview-url'
        
        
    class TrackView extends Backbone.View
        
        tagName: 'tr'

        template: Haml """
            %td %img(src=imageUrl)
            %td &= itemName
            %td &= artistName
            %td
                %a(href=url) &= playlistName
        """
        
        events:
            'click': 'play'
        
        initialize: ->
            @model.view = this
            @model.bind 'start', @onStart
            @model.bind 'stop', @onStop
        
        render: =>
            $(@el).html @template @model.toJSON()
            return this
        
        play: =>
            @model.play()
        
        onStart: =>
            $(@el).addClass 'playing'
        
        onStop: =>
            $(@el).removeClass 'playing'
        
    
    class Playlist extends Backbone.Collection
        
        model: Track
        url: '/playlist/1000/34'
        # url: '/playlist/1006/11'
    

    class AppView extends Backbone.View
        
        id: 'app'
        
        initialize: ->
            @playlist = new Playlist
            @playlist.bind 'add', @addOne
            @playlist.bind 'reset', @addAll
            @playlist.fetch()
        
        addOne: (track, index) =>
            track.set order: index
            track.bind 'complete', @onPlayComplete
            view = new TrackView model: track
            $('#playlist').append view.render().el
        
        addAll: =>
            @playlist.each @addOne
            
        onPlayComplete: (track) =>
            order = track.get 'order'
            next = @playlist.at order + 1
            next?.play()
            

    new AppView
