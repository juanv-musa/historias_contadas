import { supabase } from "./supabase-config.js";

// DOM Elements: Views
const loginView = document.getElementById("login-view");
const projectsView = document.getElementById("projects-view");
const projectDetailView = document.getElementById("project-detail-view");

// DOM Elements: Login
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const btnLogout = document.getElementById("btn-logout");

// DOM Elements: Projects
const createProjectForm = document.getElementById("create-project-form");
const newProjectNameInput = document.getElementById("new-project-name");
const projectsList = document.getElementById("projects-list");
const btnCreateProject = document.getElementById("btn-create-project");

// DOM Elements: Project Detail
const btnBackProjects = document.getElementById("btn-back-projects");
const currentProjectTitle = document.getElementById("current-project-title");

// DOM Elements: Brand
const brandForm = document.getElementById("brand-form");
const clientNameInput = document.getElementById("client-name-input");
const clientColorInput = document.getElementById("client-color-input");
const clientLogoInput = document.getElementById("client-logo-input");
const logoPreview = document.getElementById("logo-preview");
const footerLogosInput = document.getElementById("footer-logos-input");
const footerLogosPreview = document.getElementById("footer-logos-preview");
const btnSaveBrand = document.getElementById("btn-save-brand");

// DOM Elements: Stories
const storyForm = document.getElementById("story-form");
const storyTitleInput = document.getElementById("story-title-input");
const storySlugInput = document.getElementById("story-slug-input");
const storyImageInput = document.getElementById("story-image-input");
const storyEsInput = document.getElementById("story-es-input");
const storyEnInput = document.getElementById("story-en-input");
const storyTranscriptionEs = document.getElementById("story-transcription-es");
const storyTranscriptionEn = document.getElementById("story-transcription-en");
const btnUploadStory = document.getElementById("btn-upload-story");
const storiesList = document.getElementById("stories-list");

// State
let currentUserId = null;
let currentProjectId = null;

// ==============================
// AUTHENTICATION
// ==============================
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUserId = session.user.id;
        showView(projectsView);
        loadProjects();
    } else {
        currentUserId = null;
        showView(loginView);
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
    });
    
    if (error) {
        authError.classList.remove("hidden");
        authError.innerText = error.message;
    } else {
        authError.classList.add("hidden");
    }
});

btnLogout.addEventListener("click", async () => {
    await supabase.auth.signOut();
});

function showView(viewElement) {
    loginView.classList.add("hidden");
    projectsView.classList.add("hidden");
    projectDetailView.classList.add("hidden");
    viewElement.classList.remove("hidden");
}

// ==============================
// PROJECTS (CLIENTS) MANAGEMENT
// ==============================
async function loadProjects() {
    projectsList.innerHTML = "Cargando...";
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading projects", error);
        projectsList.innerHTML = `<li>Error cargando proyectos.</li>`;
        return;
    }

    if (data.length === 0) {
        projectsList.innerHTML = `
            <li class="item-card" style="justify-content:center; color: var(--text-secondary);">
                Aún no tienes proyectos. ¡Crea el primero arriba!
            </li>`;
        return;
    }

    projectsList.innerHTML = "";
    data.forEach(project => {
        const li = document.createElement("li");
        li.className = "item-card";
        
        let colorDot = project.primary_color 
            ? `<span class="project-color-preview" style="background:${project.primary_color}"></span>`
            : '';
            
        li.innerHTML = `
            <div>
                <strong>${project.name}</strong> ${colorDot}
            </div>
            <button class="btn btn-outline btn-sm">Gestionar →</button>
        `;
        
        li.addEventListener("click", () => openProject(project));
        projectsList.appendChild(li);
    });
}

createProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    btnCreateProject.disabled = true;
    btnCreateProject.innerText = "Creando...";

    const { data, error } = await supabase
        .from('projects')
        .insert([{ 
            name: newProjectNameInput.value, 
            user_id: currentUserId,
            primary_color: '#3b82f6'
        }])
        .select();

    if (error) {
        console.error("Error creating project", error);
        alert("Error al crear proyecto.");
    } else {
        newProjectNameInput.value = "";
        loadProjects();
    }
    
    btnCreateProject.disabled = false;
    btnCreateProject.innerText = "Crear Proyecto";
});

// ==============================
// PROJECT DETAIL
// ==============================
function openProject(project) {
    currentProjectId = project.id;
    currentProjectTitle.innerText = "Proyecto: " + project.name;
    
    // Rellenamos form de marca
    clientNameInput.value = project.name || "";
    clientColorInput.value = project.primary_color || "#3b82f6";
    if (project.logo_url) {
        logoPreview.src = project.logo_url;
        logoPreview.classList.remove("hidden");
    } else {
        logoPreview.classList.add("hidden");
    }

    if (project.footer_logos_url) {
        footerLogosPreview.src = project.footer_logos_url;
        footerLogosPreview.classList.remove("hidden");
    } else {
        footerLogosPreview.classList.add("hidden");
    }

    showView(projectDetailView);
    loadStories();
}

btnBackProjects.addEventListener("click", () => {
    currentProjectId = null;
    showView(projectsView);
    loadProjects();
});

// ==============================
// BRAND CONFIGURATION
// ==============================
brandForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const originalText = btnSaveBrand.innerText;
    btnSaveBrand.innerText = "Guardando...";
    btnSaveBrand.disabled = true;

    try {
        let finalLogoUrl = logoPreview.src;
        let finalFooterLogosUrl = footerLogosPreview.src;
        
        // Si hay logo principal nuevo
        if (clientLogoInput.files.length > 0) {
            const file = clientLogoInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const filePath = `logos/${currentProjectId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('historias')
                .upload(filePath, file);
                
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage
                .from('historias')
                .getPublicUrl(filePath);
                
            finalLogoUrl = data.publicUrl;
            logoPreview.src = finalLogoUrl;
            logoPreview.classList.remove("hidden");
        }

        // Si hay logos de pie nuevos
        if (footerLogosInput.files.length > 0) {
            const file = footerLogosInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `footer_${Date.now()}.${fileExt}`;
            const filePath = `logos/${currentProjectId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('historias')
                .upload(filePath, file);
                
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage
                .from('historias')
                .getPublicUrl(filePath);
                
            finalFooterLogosUrl = data.publicUrl;
            footerLogosPreview.src = finalFooterLogosUrl;
            footerLogosPreview.classList.remove("hidden");
        }

        // Actualizamos base de datos
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                name: clientNameInput.value,
                primary_color: clientColorInput.value,
                logo_url: finalLogoUrl.includes('http') ? finalLogoUrl : null,
                footer_logos_url: finalFooterLogosUrl.includes('http') ? finalFooterLogosUrl : null
            })
            .eq('id', currentProjectId);

        if (updateError) throw updateError;
        alert("¡Marca guardada con éxito!");
        
    } catch (error) {
        console.error("Error saving brand", error);
        alert("Error al guardar la marca.");
    } finally {
        btnSaveBrand.innerText = originalText;
        btnSaveBrand.disabled = false;
    }
});

// ==============================
// STORIES (MP3) MANAGEMENT
// ==============================
async function loadStories() {
    storiesList.innerHTML = "Cargando...";
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading stories", error);
        return;
    }

    if (data.length === 0) {
        storiesList.innerHTML = "<li class='item-card' style='justify-content:center;'>No hay historias subidas aún.</li>";
        return;
    }

    storiesList.innerHTML = "";
    data.forEach((story) => {
        const li = document.createElement("li");
        li.className = "item-card";
        li.style.flexDirection = "column";
        li.style.alignItems = "stretch";
        
        const playerUrl = `${window.location.origin}${window.location.pathname.replace('/admin.html', '/index.html')}?id=${story.id}`;

        const storyImagePreview = story.image_url ? `<img src="${story.image_url}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;margin-right:10px;">` : '';

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="display:flex; align-items:center;">
                    ${storyImagePreview}
                    <div>
                        <strong>${story.title}</strong>
                        <div style="font-size:0.8rem; color:#aaa; margin-top:4px;">ID: ${story.id} ${story.slug ? '| Slug: ' + story.slug : ''}</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-qr" data-url="${playerUrl}">Ver QR</button>
                    <button class="btn btn-outline btn-edit">✏️ Editar</button>
                    <button class="btn btn-danger btn-delete" data-id="${story.id}">Borrar</button>
                </div>
            </div>
            <div class="qr-container hidden" style="margin-top:1rem; padding:1rem; background:white; border-radius:8px; text-align:center;"></div>
            <div class="edit-container hidden" style="margin-top:1rem; padding:1rem; background:rgba(255,255,255,0.05); border-radius:8px; border: 1px solid var(--border-color);">
                <h4 style="margin-bottom:1rem;">Editar Historia</h4>
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" class="form-control edit-title" value="${story.title}">
                </div>
                <div class="form-group">
                    <label>Slug / ID Personalizado (ej: castellar01)</label>
                    <input type="text" class="form-control edit-slug" value="${story.slug || ''}">
                </div>
                <div class="form-group">
                    <label>Nueva Foto — dejar vacío para mantener la actual</label>
                    <input type="file" class="form-control edit-image" accept="image/*">
                </div>
                <div class="form-group">
                    <label>Nuevo Audio Español (MP3) — dejar vacío para mantener el actual</label>
                    <input type="file" class="form-control edit-audio-es" accept="audio/*">
                </div>
                <div class="form-group">
                    <label>Nuevo Audio Inglés (MP3) — dejar vacío para mantener el actual</label>
                    <input type="file" class="form-control edit-audio-en" accept="audio/*">
                </div>
                <div class="form-group">
                    <label>Transcripción Español</label>
                    <textarea class="form-control edit-transcription-es" rows="3">${story.transcription_es || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Transcripción Inglés</label>
                    <textarea class="form-control edit-transcription-en" rows="3">${story.transcription_en || ''}</textarea>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-save-edit">💾 Guardar Cambios</button>
                    <button class="btn btn-outline btn-cancel-edit">Cancelar</button>
                </div>
            </div>
        `;

        // Lógica QR
        const btnQr = li.querySelector(".btn-qr");
        const qrContainer = li.querySelector(".qr-container");
        btnQr.addEventListener("click", () => {
            if (qrContainer.classList.contains("hidden")) {
                qrContainer.classList.remove("hidden");
                qrContainer.innerHTML = "";
                new QRCode(qrContainer, {
                    text: playerUrl,
                    width: 150,
                    height: 150
                });
            } else {
                qrContainer.classList.add("hidden");
            }
        });

        // Lógica Editar
        const btnEdit = li.querySelector(".btn-edit");
        const editContainer = li.querySelector(".edit-container");
        const btnCancelEdit = li.querySelector(".btn-cancel-edit");
        const btnSaveEdit = li.querySelector(".btn-save-edit");

        btnEdit.addEventListener("click", () => {
            editContainer.classList.toggle("hidden");
        });

        btnCancelEdit.addEventListener("click", () => {
            editContainer.classList.add("hidden");
        });

        btnSaveEdit.addEventListener("click", async () => {
            btnSaveEdit.innerText = "Guardando...";
            btnSaveEdit.disabled = true;

            try {
                const newTitle = li.querySelector(".edit-title").value;
                const newSlug = li.querySelector(".edit-slug").value;
                const newImage = li.querySelector(".edit-image").files[0];
                const newFileEs = li.querySelector(".edit-audio-es").files[0];
                const newFileEn = li.querySelector(".edit-audio-en").files[0];
                const newTransEs = li.querySelector(".edit-transcription-es").value;
                const newTransEn = li.querySelector(".edit-transcription-en").value;

                let updateData = {
                    title: newTitle,
                    slug: newSlug || null,
                    transcription_es: newTransEs || null,
                    transcription_en: newTransEn || null
                };

                // Subir nueva imagen si se seleccionó
                if (newImage) {
                    const imgExt = newImage.name.split('.').pop();
                    const imgPath = `images/${currentProjectId}/${story.id}.${imgExt}`;
                    await supabase.storage.from('historias').remove([imgPath]);
                    const { error: errImg } = await supabase.storage.from('historias').upload(imgPath, newImage);
                    if (errImg) throw errImg;
                    updateData.image_url = supabase.storage.from('historias').getPublicUrl(imgPath).data.publicUrl;
                }

                // Subir nuevo audio ES si se seleccionó
                if (newFileEs) {
                    const pathEs = `audios/${currentProjectId}/${story.id}_es.mp3`;
                    // Intentar borrar el anterior y subir el nuevo
                    await supabase.storage.from('historias').remove([pathEs]);
                    const { error: errEs } = await supabase.storage.from('historias').upload(pathEs, newFileEs);
                    if (errEs) throw errEs;
                    updateData.audio_es_url = supabase.storage.from('historias').getPublicUrl(pathEs).data.publicUrl;
                }

                // Subir nuevo audio EN si se seleccionó
                if (newFileEn) {
                    const pathEn = `audios/${currentProjectId}/${story.id}_en.mp3`;
                    await supabase.storage.from('historias').remove([pathEn]);
                    const { error: errEn } = await supabase.storage.from('historias').upload(pathEn, newFileEn);
                    if (errEn) throw errEn;
                    updateData.audio_en_url = supabase.storage.from('historias').getPublicUrl(pathEn).data.publicUrl;
                }

                // Actualizar en la base de datos
                const { error: updateError } = await supabase
                    .from('stories')
                    .update(updateData)
                    .eq('id', story.id);

                if (updateError) throw updateError;

                alert("✅ Historia actualizada con éxito. El QR sigue siendo el mismo.");
                loadStories();

            } catch (error) {
                console.error("Error updating story", error);
                alert("Error al actualizar: " + error.message);
            } finally {
                btnSaveEdit.innerText = "💾 Guardar Cambios";
                btnSaveEdit.disabled = false;
            }
        });

        // Lógica Borrar
        const btnDelete = li.querySelector(".btn-delete");
        btnDelete.addEventListener("click", async () => {
            if (confirm("¿Seguro que quieres borrar esta historia? (Borrará el registro, debes limpiar los MP3 en Supabase).")) {
                await supabase.from('stories').delete().eq('id', story.id);
                loadStories();
            }
        });

        storiesList.appendChild(li);
    });
}

storyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const originalText = btnUploadStory.innerText;
    btnUploadStory.innerText = "Subiendo (no cierres la pestaña)...";
    btnUploadStory.disabled = true;

    try {
        const title = storyTitleInput.value;
        const fileImage = storyImageInput.files[0];
        const fileEs = storyEsInput.files[0];
        const fileEn = storyEnInput.files[0];
        const transcriptionEs = storyTranscriptionEs.value;
        const transcriptionEn = storyTranscriptionEn.value;

        if (!title || !fileEs || !fileEn) {
            alert("Rellena el título y los dos archivos de audio.");
            return;
        }

        // 1. Insert placeholder to get ID
        const title = storyTitleInput.value;
        const slug = storySlugInput.value;
        const { data: insertedData, error: insertError } = await supabase
            .from('stories')
            .insert([{ 
                project_id: currentProjectId, 
                title: title + " (Subiendo...)",
                slug: slug || null
            }])
            .select();
            
        if (insertError) throw insertError;
        const storyId = insertedData[0].id;

        // 2. Upload ES
        const pathEs = `audios/${currentProjectId}/${storyId}_es.mp3`;
        const { error: errEs } = await supabase.storage.from('historias').upload(pathEs, fileEs);
        if (errEs) throw errEs;
        const urlEs = supabase.storage.from('historias').getPublicUrl(pathEs).data.publicUrl;

        // 3. Upload EN
        const pathEn = `audios/${currentProjectId}/${storyId}_en.mp3`;
        const { error: errEn } = await supabase.storage.from('historias').upload(pathEn, fileEn);
        if (errEn) throw errEn;
        const urlEn = supabase.storage.from('historias').getPublicUrl(pathEn).data.publicUrl;

        // 4. Upload image if provided
        let imageUrl = null;
        if (fileImage) {
            const imgExt = fileImage.name.split('.').pop();
            const imgPath = `images/${currentProjectId}/${storyId}.${imgExt}`;
            const { error: errImg } = await supabase.storage.from('historias').upload(imgPath, fileImage);
            if (errImg) throw errImg;
            imageUrl = supabase.storage.from('historias').getPublicUrl(imgPath).data.publicUrl;
        }

        // 5. Update story with final URLs, image, transcriptions and original title
        const { error: updateError } = await supabase
            .from('stories')
            .update({
                title: title,
                audio_es_url: urlEs,
                audio_en_url: urlEn,
                image_url: imageUrl,
                transcription_es: transcriptionEs || null,
                transcription_en: transcriptionEn || null
            })
            .eq('id', storyId);

        if (updateError) throw updateError;

        alert("Historia subida con éxito.");
        storyForm.reset();
        loadStories();

    } catch (error) {
        console.error("Error uploading story", error);
        alert("Error al subir los archivos: " + error.message);
    } finally {
        btnUploadStory.innerText = originalText;
        btnUploadStory.disabled = false;
    }
});
