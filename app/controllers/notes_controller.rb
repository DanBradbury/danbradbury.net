class NotesController < ApplicationController
  def index
    @notes = Note.all
  end

  def new
    @note = Note.new
  end

  def create
    @note = Note.new(note_params)
    if @note.save
      respond_to do |format|
        format.html { redirect_to notes_path }
        format.turbo_stream
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @note = Note.find(params[:id])
  end

  def update
    @note = Note.find(params[:id])
    if @note.update(note_params)
      respond_to do |format|
        format.html { redirect_to notes_path, notice: "Quote was successfully updated." }
        format.turbo_stream
      end
    else
      render :edit
    end
  end
  private

  def note_params
    params.require(:note).permit(:content)
  end
end
