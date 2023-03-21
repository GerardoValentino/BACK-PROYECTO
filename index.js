const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const { initializeApp } = require('firebase/app') 
const { getFirestore, collection, getDoc, setDoc, doc, getDocs, updateDoc, deleteDoc } = require('firebase/firestore') // getFirestore es para traer la coleccion de la base de datos 

require('dotenv/config')

// Configuracion de firebase
const firebaseConfig = {
    apiKey: "AIzaSyBpPvClb8wzFyPZ_RAIx7a0Dzkz1M5VLqg",
    authDomain: "gvrr-back.firebaseapp.com",
    projectId: "gvrr-back",
    storageBucket: "gvrr-back.appspot.com",
    messagingSenderId: "657765580015",
    appId: "1:657765580015:web:4f0947a6648730d2a3af1a"
  };

// Inicializacion de la DB en firebase
const firebase = initializeApp(firebaseConfig)
const db = getFirestore()

// Inicializaciamos Servidor
const app = express()

// Opciones de CORS
const corsOptions = {
    "origin": "*",
    "optionSuccessStatus": 200
}

// Configuracion del servidor
app.use(express.json())
app.use(cors(corsOptions))

// Ruta para insertar registro
app.post('/insertar', (req, res) => {
    const { name, lastname, email, password, number } = req.body

    if(!name || !lastname|| !email || !password || !number) {
        res.json({
            'alert': 'Faltan datos'
        })
        return
    }

    // Validaciones
    if(name.length < 3) { // Si la longitud del nombre es menor a 3
        res.json({
            'alert': 'El nombre requiere minimo de 3 caracteres' // Esto se vera en el front
        })
    } else if (lastname.length < 3) {
        res.json({
            'alert': 'El apellido requiere minimo de 3 caracteres' 
        })
    } else if (!email.length) { // Si no existe una longitud para el correo
        res.json({
            'alert': 'No ingresaste un correo electronico' 
        })
    } else if (password.length < 8) {
        res.json({
            'alert': 'La contraseña debe tener minimo 8 caracteres' 
        })
    } else if (!Number(number) || !number.length === 10){ // Si el numero telefonico No es un numero o tenga una longitud igual que 10
        res.json({
            'alert': 'Introduce un numero válido' 
        })
    } else {
        // NOs conectamos a la base de datos y generamos una coleccion
        const alumnos = collection(db, "alumnos") 
        getDoc(doc(alumnos, email)).then(alumno => {
            if(alumno.exists()) {
                res.json({
                    'alert': 'El correo ya existe' 
                })
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    // encriptamos el password
                    bcrypt.hash(password, salt, (err, hash) => {
                        sendData = {
                            name, 
                            lastname,
                            email,
                            password: hash,
                            number
                        }
                        // Para guardar en la base de datos
                        // Se guardara en la coleccion llamada "alumnos"
                        setDoc(doc(alumnos, email), sendData).then(() => {
                            res.json({
                                'alert': 'success'
                            })
                        }).catch((error) => {
                            res.json({
                                'alert': error
                            })
                        })
                    })
                })
            }
        })
    }
})

// Ruta para logearse
app.post('/login', (req, res) => {
    const {email, password} = req.body
    // Con esto verificamos que llegue toda la informacion
    if( !email || !password) {
        res.json({
            'alert': 'Faltan datos'
        })
    }

    const alumnos = collection(db, 'alumnos')
    // Verificar que en todos los registros que haya exista un correo electronico
    getDoc(doc(alumnos, email))
    .then((alumno) => {
        if(!alumno.exists()){ // Si no existe el alumno
            res.json({'alert': 'Correo no registrado'})
        } else {
            // Verificamos que la contraseña que escribio si sea la contraseña correcta
            bcrypt.compare(password, alumno.data().password, (error, result) => {
                if(result) { // si se genera la variable result, es que la contraseña si coincidio
                    // Para regresar datos
                    let data = alumno.data()
                    res.json({
                        'alert': 'success',
                        name: data.name,
                        lastname: data.lastname
                    })
                } else {
                    res.json({'alert': 'Contraseña Incorrecta'})
                }
            })
        }
    })
})

// Ruta para obtener documentos en BD
app.get('/traertodo', async (req, res) => {
    const alumnos = collection(db, "alumnos")
    // todo lo que encuentre se guardara en un arreglo
    const arreglo = await getDocs(alumnos) 
    let returnData = [] // Lo que le vamos a regresar al usuario para que pueda ver lo que hay en la db
    arreglo.forEach((alumno) => {
        returnData.push(alumno.data())
    })
    res.json({
        'alert': 'Success',
        'data': returnData
    })
})

// Ruta para eliminar
app.post('/eliminar', (req, res) => { ///eliminar/:id
    const {email} = req.body
    //let alumnoBorrado = db.collection('alumnos').where('email', '==', email)
    console.log('email', email)
    let alumnoBorrado = doc(db, "alumnos", email)
    console.log('alumno', alumnoBorrado, email)
    deleteDoc(alumnoBorrado)
    res.json({
        'alert': 'success'
    })
})

// Ruta para actualizar
app.post('/actualizar', (req, res) => {
    const {name, email, lastname, number} = req.body
    // Necesitamos validar que nos lleguen estos campos
    if(name.length < 3) { // Si la longitud del nombre es menor a 3
        res.json({
            'alert': 'El nombre requiere minimo de 3 caracteres' // Esto se vera en el front
        })
    } else if (lastname.length < 3) {
        res.json({
            'alert': 'El apellido requiere minimo de 3 caracteres' 
        })
    } else if (!email.length) { // Si no existe una longitud para el correo
        res.json({
            'alert': 'No ingresaste un correo electronico' 
        })
    } else if (!Number(number) || !number.length === 10){ // Si el numero telefonico No es un numero o tenga una longitud igual que 10
        res.json({
            'alert': 'Introduce un numero válido' 
        })
    } else {
        // Obtener el documento del usuario
        //const alumno = doc(db, "alumnos", email)
        const dataUpdate = {
            name,
            lastname,
            number
        }
        
        const alumnos = collection(db, 'alumnos')
        updateDoc(doc(alumnos, email), dataUpdate)
        .then((response) => {
            res.json({
                'alert': 'success'
            })
        })
        .catch((error) => {
            res.json({
                'alert': error
            })
        })
    }
})

const PORT = process.env.PORT || 12000
app.listen(PORT, () => {
    console.log(`Escuchando Puerto: ${PORT}`)
})