// matrices
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// our vertex data
attribute vec3 aPosition;

// our texcoordinates
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
    // send the vertex information on to the fragment shader
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
}
