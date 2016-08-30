const SEGS_X = 4;
const SEGS_Y = 4;
const VERTS_X = SEGS_X + 1;
const VERTS_Y = SEGS_Y + 1;

class TerrainPatch extends THREE.Mesh {
  constructor( opts ) {
    super();
    this.objects = [];
    this.width = opts.hasOwnProperty( 'width' ) ? opts.width : 0;
    this.height = opts.hasOwnProperty( 'height' ) ? opts.height : 0;
    this.heightmap = opts.hasOwnProperty( 'heightmap' ) ? opts.heightmap : undefined;
    let position = opts.hasOwnProperty( 'position' ) ? opts.position : new THREE.Vector3();
    this.position.set( position.x, position.y, position.z );
    this.material = opts.hasOwnProperty( 'material' ) ? opts.material : undefined;
    this.verts = null;
    this.geometry = this.createGeometry();
  }

  rebuild() {
    let vertsX = SEGS_X + 1;
    let vertsY = SEGS_Y + 1;
    let v = 0;
    for ( let i = 0; i < vertsY; ++i ) {
      for ( let j = 0; j < vertsX; ++j, v += 3 ) {
        this.verts[ v + 1 ] = 0.0;
        let noise = this.heightmap.getHeight(
          this.verts[ v ] + this.position.x,
          this.verts[ v + 2 ] + this.position.z
        );
        this.verts[ v + 1 ] = noise;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /// Get world position on terrain based off normalized XZ coordinates
  getPosition( coord ) {
    let ix1 = Math.round( coord.x * SEGS_X );
    let iy1 = Math.round( coord.y * SEGS_Y );
    let index = VERTS_X * iy1 + ix1;
    return {
      x: this.verts[ index * 3 ] + this.position.x,
      y: this.verts[ index * 3 + 1 ] + this.position.y,
      z: this.verts[ index * 3 + 2 ] + this.position.z,
    };
  }

  createGeometry() {
    let geo = new THREE.BufferGeometry();
    let vertsX = SEGS_X + 1;
    let vertsY = SEGS_Y + 1;

    this.verts = new Float32Array( vertsX * vertsY * 3 );
    this.uvs = new Float32Array( vertsX * vertsY * 2 );
    let v = 0;
    let uv = 0;
    let stepX = this.width / SEGS_X;
    let stepY = this.height / SEGS_Y;
    for ( let j = 0; j < vertsY; ++j ) {
      for ( let i = 0; i < vertsX; ++i, v += 3, uv += 2 ) {
        let pos = {
          x: i * stepX,
          y: 0,
          z: j * stepY
        };
        let noise = this.heightmap.getHeight(
          pos.x + this.position.x,
          pos.z + this.position.z
        );
        pos.y = noise;
        this.verts[ v ] = pos.x;
        this.verts[ v + 1 ] = pos.y;
        this.verts[ v + 2 ] = pos.z;
        this.uvs[ uv ] = i / ( vertsX - 1 );
        this.uvs[ uv + 1 ] = j / ( vertsY - 1 );
      }
    }

    let indices = new Uint32Array( SEGS_X * SEGS_Y * 6 );

    for ( let i = 0, t = 0, j = 0, v = 0; i < SEGS_Y; ++i, v = i * vertsX ) {
      for ( j = 0; j < SEGS_X; ++j, t += 6, v++ ) {
        indices[ t ] = v;
        indices[ t + 1 ] = v + vertsX;
        indices[ t + 2 ] = v + vertsX + 1;
        indices[ t + 3 ] = v;
        indices[ t + 4 ] = v + vertsX + 1;
        indices[ t + 5 ] = v + 1;
      }
    }

    geo.addAttribute( 'position', new THREE.BufferAttribute( this.verts, 3 ) );
    geo.addAttribute( 'uv', new THREE.BufferAttribute( this.uvs, 2 ) );
    geo.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    geo.computeVertexNormals();
    return geo;
  }
}

export default TerrainPatch;
